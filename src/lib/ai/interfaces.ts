/**
 * Standardized AI Library Interfaces
 * 
 * This file defines common interfaces and types used across all AI services
 * to ensure consistency and maintainability.
 */

import { z } from 'zod';

// ==========================================
// COMMON ENTITY TYPES
// ==========================================

export type EntityType = 'opportunity' | 'proposal' | 'organization' | 'section' | 'knowledge';

export interface BaseEntity {
  id: string;
  type: EntityType;
}

// ==========================================
// CONTENT INTERFACES
// ==========================================

/**
 * Standard content structure for extracted/processed content
 */
export interface ProcessedContent {
  text: string;
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  title?: string;
  description?: string;
  author?: string;
  pages?: number;
  duration?: number;
  url?: string;
  fileType?: string;
  extractedAt: string;
  processingVersion?: string;
}

/**
 * Content chunk for vector storage and RAG
 */
export interface ContentChunk {
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
  sourceFileId?: string;
  sourceUrl?: string;
}

export interface ChunkMetadata extends ContentMetadata {
  chunkIndex: number;
  totalChunks: number;
  startOffset?: number;
  endOffset?: number;
}

// ==========================================
// EXTRACTION INTERFACES
// ==========================================

/**
 * Standard contact extraction result
 */
export interface ExtractedContact {
  name?: string;
  email?: string;
  title?: string;
  phone?: string;
  linkedIn?: string;
  organization?: string;
  confidence?: number;
}

/**
 * Standard organization extraction result
 */
export interface ExtractedOrganization {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  confidence?: number;
}

/**
 * Standard service extraction result
 */
export interface ExtractedService {
  name: string;
  description?: string;
  category?: string;
  technologies?: string[];
  confidence?: number;
}

// ==========================================
// DOCUMENT ANALYSIS INTERFACES
// ==========================================

export type DocumentType = 'requirements' | 'proposal' | 'general' | 'rfp' | 'ideation' | 'reference' | 'transcript' | 'service_offering' | 'methodology' | 'case_study' | 'testimonials' | 'other';

export interface DocumentClassification {
  documentType: DocumentType;
  confidence: number;
  reasoning: string;
  suggestedSections: string[];
  priority: 'high' | 'medium' | 'low';
  keyTopics: string[];
  shouldUpdateSections: boolean;
}

export interface SemanticSection {
  title: string;
  keywords: string[];
  content: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface SectionMatch {
  sectionId: string;
  confidence: number;
  mergeType?: 'direct' | 'partial' | 'enhancement';
}

// ==========================================
// PROGRESS TRACKING INTERFACES
// ==========================================

export interface ProcessingProgress {
  stage: string;
  current: number;
  total: number;
  message: string;
  phase?: 'extracting' | 'embedding' | 'analyzing' | 'completing';
  phaseProgress?: number;
}

export type ProgressCallback = (progress: ProcessingProgress) => void | Promise<void>;

// ==========================================
// GENERATION INTERFACES
// ==========================================

export interface GenerationContext {
  entityType: EntityType;
  entityId: string;
  context: string;
}

export interface ContentGenerationResult {
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
    confidence: number;
    sources?: string[];
    generatedAt: string;
  };
}

// ==========================================
// SEARCH INTERFACES
// ==========================================

export interface SearchResult {
  content: string;
  similarity: number;
  metadata: ChunkMetadata;
}

export interface KnowledgeBaseSearch {
  query: string;
  entityType: EntityType;
  entityId: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  context: string[];
  metadata: {
    totalResults: number;
    searchTime: number;
    usedCache: boolean;
  };
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const ValidationSchemas = {
  entityType: z.enum(['opportunity', 'proposal', 'organization', 'section', 'knowledge']),
  entityId: z.string().uuid('Invalid entity ID format'),
  nonEmptyString: z.string().min(1, 'String cannot be empty'),
  positiveNumber: z.number().positive('Number must be positive'),
  
  processedContent: z.object({
    text: z.string().min(1),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      author: z.string().optional(),
      pages: z.number().optional(),
      duration: z.number().optional(),
      url: z.string().url().optional(),
      fileType: z.string().optional(),
      extractedAt: z.string(),
      processingVersion: z.string().optional(),
    }),
  }),

  extractedContact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    title: z.string().optional(),
    phone: z.string().optional(),
    linkedIn: z.string().url().optional(),
    organization: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
  }),

  semanticSection: z.object({
    title: z.string().min(1),
    keywords: z.array(z.string()),
    content: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),

  generationContext: z.object({
    entityType: z.enum(['opportunity', 'proposal', 'organization', 'section', 'knowledge']),
    entityId: z.string().uuid(),
    context: z.string().optional(),
  }),
} as const;

// ==========================================
// ERROR INTERFACES
// ==========================================

export interface AIOperationError {
  type: 'validation' | 'processing' | 'api' | 'timeout' | 'rate_limit';
  message: string;
  code?: string;
  retryable: boolean;
  context?: Record<string, unknown>;
}

// ==========================================
// SERVICE INTERFACES
// ==========================================

/**
 * Standard interface for content extraction services
 */
export interface ContentExtractor {
  extractFromFile(file: File | Buffer, fileType: string, fileId?: string): Promise<ProcessedContent>;
  extractFromUrl(url: string): Promise<ProcessedContent>;
}

/**
 * Standard interface for document analysis services
 */
export interface DocumentAnalyzer {
  analyzeDocument(content: string, existingSections: SemanticSection[], onProgress?: ProgressCallback): Promise<SemanticSection[]>;
  // classifyDocument(content: string): Promise<DocumentClassification>;
  detectDocumentType(content: string): DocumentType;
}

/**
 * Standard interface for content generation services
 */
export interface ContentGenerator {
  generateContent(prompt: string, context: GenerationContext): Promise<ContentGenerationResult>;
  generateSectionContent(documentType: string, sectionType: string, context: GenerationContext): Promise<ContentGenerationResult>;
  improveSectionContent(documentType: string, sectionType: string, existingContent: string, requirements: string, context: GenerationContext): Promise<ContentGenerationResult>;
}

/**
 * Standard interface for embedding and search services
 */
export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  searchSimilar(query: string, entityType: EntityType, entityId: string, limit?: number): Promise<SearchResponse>;
}

export default {
  ValidationSchemas,
}; 