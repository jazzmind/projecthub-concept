import { MODELS } from './models';
import { z } from 'zod';
import { AIService } from './aiService';
import { 
  EmbeddingProvider, 
  EntityType, 
  SearchResponse, 
  ContentChunk,
  ValidationSchemas 
} from './interfaces';

export interface TextChunk {
  content: string;
  index: number;
  totalChunks: number;
}

/**
 * Enhanced EmbeddingService extending AIService base class
 * Provides embedding generation, text chunking, and vector search capabilities
 */
export class EmbeddingService extends AIService implements EmbeddingProvider {
  private readonly maxChunkSize = 8000; // OpenAI embedding limit
  private readonly chunkOverlap = 200;
  private readonly embeddingBatchSize = 20; // Process embeddings in batches

  constructor() {
    super({
      maxRetries: 3,
      timeoutMs: 60000, // 1 minute for embeddings
      enableLogging: true,
      enableDebugLogging: true,
      logPrefix: 'EmbeddingService',
    });
  }

  /**
   * Generate embedding for a single text string
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Validate input
    const validatedText = this.validateInput(text, ValidationSchemas.nonEmptyString, 'generateEmbedding');

    const operation = async () => {
      const response = await this.client.embeddings.create({
        model: MODELS.embedding,
        input: validatedText,
      });

      return response.data[0].embedding;
    };

    const result = await this.executeWithRetry(operation, 'generateEmbedding');
    return result.data;
  }

  /**
   * Generate embeddings for multiple text strings
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Validate input
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    const operation = async () => {
      const response = await this.client.embeddings.create({
        model: MODELS.embedding,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    };

    const result = await this.executeWithRetry(operation, `generateEmbeddings(${texts.length} texts)`);
    return result.data;
  }

  /**
   * Chunk text into manageable pieces for processing
   */
  chunkText(text: string): TextChunk[] {
    this.log(`Starting text chunking. Input length: ${text.length}`);
    this.log(`Memory at start of chunking: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
    
    if (text.length <= this.maxChunkSize) {
      this.log('Text fits in single chunk');
      return [{
        content: text,
        index: 0,
        totalChunks: 1,
      }];
    }

    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;
    let iterations = 0;
    const maxIterations = Math.ceil(text.length / (this.maxChunkSize - this.chunkOverlap)) + 10; // Safety margin

    this.log(`Expected max iterations: ${maxIterations}`);

    while (startIndex < text.length) {
      iterations++;
      
      // Safety check for infinite loops
      if (iterations > maxIterations) {
        this.log(`INFINITE LOOP DETECTED! Iterations: ${iterations}, maxIterations: ${maxIterations}`, 'error');
        this.log(`Current startIndex: ${startIndex}, text.length: ${text.length}`, 'error');
        this.log(`Current chunk count: ${chunks.length}`, 'error');
        throw new Error(`Infinite loop detected in text chunking after ${iterations} iterations`);
      }
      
      // Log progress every 10 chunks
      if (iterations % 10 === 0) {
        this.log(`Chunking progress: iteration ${iterations}, startIndex: ${startIndex}/${text.length}, chunks: ${chunks.length}`);
        this.log(`Memory during chunking: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
      }
      
      let endIndex = Math.min(startIndex + this.maxChunkSize, text.length);
      
      // Try to break at a sentence or paragraph boundary
      if (endIndex < text.length) {
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > startIndex + this.maxChunkSize * 0.5) {
          endIndex = breakPoint + 1;
        }
      }

      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push({
          content: chunk,
          index: chunkIndex,
          totalChunks: 0, // Will be updated after all chunks are created
        });
        chunkIndex++;
      }

      // Handle end-of-text properly to prevent infinite loops
      if (endIndex >= text.length) {
        this.log(`Reached end of text at endIndex: ${endIndex}`);
        break;
      }

      // Calculate next start position
      const newStartIndex = endIndex - this.chunkOverlap;
      
      // Ensure we always make progress
      if (newStartIndex <= startIndex) {
        this.log(`Overlap too large near end of text. startIndex: ${startIndex}, newStartIndex: ${newStartIndex}, advancing without overlap`);
        startIndex = endIndex;
      } else {
        startIndex = newStartIndex;
      }
    }

    this.log(`Chunking complete. Created ${chunks.length} chunks in ${iterations} iterations`);
    this.log(`Memory after chunking: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);

    // Update totalChunks for all chunks
    chunks.forEach(chunk => {
      chunk.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Process content for RAG (Retrieval Augmented Generation)
   */
  async processContentForRAG(
    content: string,
    metadata: {
      title?: string;
      fileType?: string;
      sourceFileId?: string;
      sourceUrl?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<ContentChunk[]> {
    this.log(`Starting RAG processing for content: ${content.length} characters`);
    
    const chunks = this.chunkText(content);
    this.log(`Content chunked into ${chunks.length} pieces`);
    
    // Process embeddings in batches to prevent memory issues
    const embeddings: number[][] = [];
    const totalBatches = Math.ceil(chunks.length / this.embeddingBatchSize);
    
    for (let i = 0; i < chunks.length; i += this.embeddingBatchSize) {
      const batchEnd = Math.min(i + this.embeddingBatchSize, chunks.length);
      const batch = chunks.slice(i, batchEnd).map(c => c.content);
      const currentBatch = Math.floor(i / this.embeddingBatchSize) + 1;
      
      this.log(`Processing embedding batch ${currentBatch}/${totalBatches} (${batch.length} chunks)`);
      
      // Update progress callback if provided
      const batchProgress = ((currentBatch - 1) / totalBatches) * 100;
      onProgress?.(batchProgress);
      
      try {
        const batchEmbeddings = await this.generateEmbeddings(batch);
        embeddings.push(...batchEmbeddings);
        
        this.log(`Batch complete. Memory after batch: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
        
        // Update progress after batch completion
        const completedProgress = (currentBatch / totalBatches) * 100;
        onProgress?.(completedProgress);
        
        // Small delay to allow garbage collection
        if (i + this.embeddingBatchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.log(`Error processing embedding batch ${i}-${batchEnd}: ${error}`, 'error');
        throw error;
      }
    }

    // Combine chunks with embeddings
    const extractedAt = new Date().toISOString();
    return chunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: embeddings[index],
      metadata: {
        title: metadata.title,
        fileType: metadata.fileType,
        chunkIndex: chunk.index,
        totalChunks: chunk.totalChunks,
        extractedAt,
      },
      sourceFileId: metadata.sourceFileId,
      sourceUrl: metadata.sourceUrl,
    }));
  }

  /**
   * Search for similar content (stub implementation - would need vector DB integration)
   */
  async searchSimilar(
    query: string, 
    entityType: EntityType, 
    entityId: string, 
    limit: number = 5
  ): Promise<SearchResponse> {
    // This is a stub implementation - in practice would query vector database
    this.log(`Searching for similar content: "${query}" in ${entityType}:${entityId} (limit: ${limit})`);
    
    // Generate embedding for future vector search implementation
    await this.generateEmbedding(query);
    
    // TODO: Implement actual vector database search
    // const queryEmbedding = await this.generateEmbedding(query);
    // const searchResults = await vectorDatabase.search(queryEmbedding, entityType, entityId, limit);
    
    // Placeholder response
    return {
      results: [],
      context: [],
      metadata: {
        totalResults: 0,
        searchTime: 0,
        usedCache: false,
      },
    };
  }

  /**
   * Generate contextual response using knowledge base
   */
  async generateContextualResponse(
    query: string,
    context: string[],
    systemPrompt?: string,
    model?: string
  ): Promise<string> {
    const responseFormat = z.object({
      content: z.string()
    });

    const result = await this.callAI(
      model || MODELS.best,
      [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful assistant that provides detailed, accurate responses based on the provided context.',
        },
        {
          role: 'user',
          content: `Context:\n${context.join('\n\n')}\n\nQuestion: ${query}`,
        },
      ],
      responseFormat,
      'generateContextualResponse',
      'content'
    );

    return result.content || '';
  }

}

// Export singleton instance
export const embeddingService = new EmbeddingService(); 