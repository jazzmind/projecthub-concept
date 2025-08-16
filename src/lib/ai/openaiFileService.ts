import OpenAI from 'openai';
import crypto from 'crypto';
import { FileConcept } from '@/lib/concepts/common/file';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const fileConcept = new FileConcept();

export interface OpenAIFileResult {
  fileId: string;
  wasUploaded: boolean; // true if newly uploaded, false if cached
  filename: string;
  purpose: string;
}

/**
 * Service for managing OpenAI file uploads with caching
 */
export class OpenAIFileService {
  /**
   * Hash a file buffer to create a unique identifier
   */
  private hashFile(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Check if a file has been previously uploaded to OpenAI
   */
  private async findExistingFile(
    contentHash: string,
    organizationId: string
  ): Promise<string | null> {
    try {
      // Use File concept to find files attached to the organization
      const files = await fileConcept._getByAttachedEntity({ 
        entityType: 'organization', 
        entityId: organizationId 
      });

      // Look for a file with matching content hash in metadata
      for (const file of files) {
        if (file.metadata) {
          const metadata = file.metadata as Record<string, unknown>;
          if (metadata.contentHash === contentHash && metadata.openaiFileId) {
            return metadata.openaiFileId as string;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for existing OpenAI file:', error);
      return null;
    }
  }

  /**
   * Store OpenAI file metadata in database using File concept
   */
  private async storeFileMetadata(
    contentHash: string,
    openaiFileId: string,
    originalFilename: string,
    organizationId: string,
    buffer: Buffer
  ): Promise<string> {
    try {
      const fileId = crypto.randomUUID();
      
      // Use File concept to upload the file metadata
      const result = await fileConcept.upload({
        id: fileId,
        filename: `openai-${openaiFileId}`,
        originalName: originalFilename,
        mimeType: this.getMimeType(originalFilename),
        size: buffer.length,
        path: `/openai/${openaiFileId}`,
        uploadedByEntityType: 'organization',
        uploadedByEntityId: organizationId,
        attachToEntityType: 'organization',
        attachToEntityId: organizationId,
        isPublic: false,
        metadata: {
          contentHash,
          openaiFileId,
          originalFilename,
          uploadedAt: new Date().toISOString(),
          purpose: 'assistants',
          fileType: 'openai_upload'
        }
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      return fileId;
    } catch (error) {
      console.error('Error storing OpenAI file metadata:', error);
      throw error;
    }
  }

  /**
   * Upload file to OpenAI or return cached file ID
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    organizationId: string,
    purpose: OpenAI.Files.FileCreateParams['purpose'] = 'assistants'
  ): Promise<OpenAIFileResult> {
    try {
      // Generate content hash
      const contentHash = this.hashFile(buffer);
      console.log(`Generated content hash for ${filename}: ${contentHash}`);

      // Check if file already exists
      const existingFileId = await this.findExistingFile(contentHash, organizationId);
      
      if (existingFileId) {
        console.log(`Found existing OpenAI file: ${existingFileId}`);
        
        // Verify the file still exists in OpenAI
        try {
          await openai.files.retrieve(existingFileId);
          return {
            fileId: existingFileId,
            wasUploaded: false,
            filename,
            purpose
          };
        } catch {
          console.log(`Cached OpenAI file ${existingFileId} no longer exists, will re-upload`);
        }
      }

      // Upload to OpenAI
      console.log(`Uploading ${filename} to OpenAI (${buffer.length} bytes)`);
      const file = new File([new Uint8Array(buffer)], filename, {
        type: this.getMimeType(filename)
      });

      const uploadResponse = await openai.files.create({
        file,
        purpose
      });

      console.log(`Successfully uploaded to OpenAI: ${uploadResponse.id}`);

      // Store metadata in database using File concept
      await this.storeFileMetadata(
        contentHash,
        uploadResponse.id,
        filename,
        organizationId,
        buffer
      );

      return {
        fileId: uploadResponse.id,
        wasUploaded: true,
        filename,
        purpose
      };

    } catch (error) {
      console.error('Error in OpenAI file upload:', error);
      throw new Error(`Failed to upload file to OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Convert PDF to images and extract text using GPT-4o vision
   * For now, this returns a fallback message since PDF to image conversion requires additional libraries
   */
  async extractTextFromPDF(
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    try {
      // For now, return a message indicating PDF processing is not fully implemented
      // In a real implementation, you would:
      // 1. Install pdf2pic or similar library
      // 2. Convert PDF pages to images
      // 3. Process each image with GPT-4o vision
      
      console.log(`PDF processing requested for ${filename} (${buffer.length} bytes)`);
      
      return `[PDF FILE UPLOADED - TEXT EXTRACTION LIMITED]

This PDF file "${filename}" has been processed but full text extraction from PDFs requires additional setup.

File size: ${buffer.length} bytes

To enable full PDF text extraction:
1. Install pdf2pic or similar PDF-to-image library
2. Implement convertPDFToImages method
3. Process each page image with GPT-4o vision

The file is available for further processing once these dependencies are configured.`;

    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  }

  /**
   * Convert PDF to base64 images (placeholder implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async convertPDFToImages(_buffer: Buffer): Promise<string[]> {
    // This would require pdf2pic or similar library
    // For now, we'll use a simpler approach and assume the caller handles PDF conversion
    // In a real implementation, you'd use libraries like pdf2pic or pdf-poppler
    
    // Placeholder - in practice you'd implement actual PDF to image conversion
    throw new Error('PDF to image conversion not implemented. Please convert PDF to images before processing.');
  }

  /**
   * Extract text from image using GPT-4o vision
   */
  private async extractTextFromImage(imageBase64: string, context: string): Promise<string> {
    try {
      console.log(`Extracting text from image: ${context}`);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [
          {
            role: 'system',
            content: `You are an expert text extraction tool. Extract all text content from this image accurately. 
            
            Preserve the structure and formatting as much as possible. Include:
            - All text content
            - Headers and titles  
            - Tables (convert to text format)
            - Lists and bullet points
            - Any other readable content
            
            Return only the extracted text without any additional commentary.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all text content from this image. Context: ${context}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI vision');
      }

      return content;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process file and return OpenAI file ID for direct use in AI calls
   * This method handles caching and returns the file ID instead of extracting text
   */
  async processFileForAI(
    buffer: Buffer,
    filename: string,
    organizationId: string
  ): Promise<string> {
    console.log(`Processing file for AI: ${filename}`);

    try {
      // Check if file already exists in our cache
      const contentHash = this.hashFile(buffer);
      const existingFileId = await this.findExistingFile(contentHash, organizationId);
      
      if (existingFileId) {
        console.log(`Using cached OpenAI file: ${existingFileId}`);
        return existingFileId;
      }

      // Upload new file to OpenAI
      console.log(`Uploading new file to OpenAI: ${filename}`);
      const fileResult = await this.uploadFile(
        buffer,
        filename,
        organizationId,
        'assistants'
      );
      
      console.log(`File processed successfully: ${filename} -> ${fileResult.fileId}`);
      return fileResult.fileId;

    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Clean up old OpenAI files (optional maintenance function)
   */
  async cleanupOldFiles(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Note: This method would need additional File concept queries to properly 
      // filter by creation date and metadata. For now, we'll implement a basic version.
      console.log(`Cleanup of files older than ${olderThanDays} days not fully implemented`);
      console.log('This would require additional File concept query methods for date filtering');

    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

// Export singleton instance
export const openaiFileService = new OpenAIFileService(); 