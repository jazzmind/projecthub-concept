import { AIService, AIError, AIErrorType } from './aiService';
import { MODELS } from './models';
import { openaiFileService } from './openaiFileService';
import { z } from 'zod';
import mammoth from 'mammoth';

/**
 * Schema for extracted project data
 */
const ExtractedProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  scope: z.string().min(1, 'Scope is required'),
  industry: z.string().min(1, 'Industry is required'),
  domain: z.string().min(1, 'Domain is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Difficulty must be beginner, intermediate, or advanced' })
  }),
  estimatedHours: z.number().min(1).max(1000, 'Estimated hours must be between 1 and 1000'),
  deliverables: z.array(z.string().min(1)).min(1, 'At least one deliverable is required'),
  imagePrompt: z.string().min(1, 'Image generation prompt is required'),
});

export type ExtractedProject = z.infer<typeof ExtractedProjectSchema>;

/**
 * Service for extracting project data from documents using AI
 */
export class ProjectExtractionService extends AIService {
  constructor() {
    super({
      maxRetries: 2,
      timeoutMs: 90000, // 90 seconds for document processing
      enableLogging: true,
      enableDebugLogging: true,
      logPrefix: 'ProjectExtraction',
    });
  }

  /**
   * Extract text content from different file types
   */
  private async extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf':
        // For PDF files, we'll use OpenAI's file processing
        throw new Error('PDF processing should use OpenAI file upload');
        
      case 'docx':
        try {
          const result = await mammoth.extractRawText({ buffer });
          return result.value;
        } catch (error) {
          throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
      case 'doc':
        // Legacy DOC files are more complex to parse, for now we'll reject them
        throw new Error('Legacy .doc files are not supported. Please convert to .docx or .pdf format.');
        
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Extract project data from a document file with optional progress callback
   */
  async extractFromDocument(
    buffer: Buffer,
    filename: string,
    organizationId: string,
    quality: 'low' | 'medium' | 'high',
    onProgress?: (stage: string, progress: number) => void
  ): Promise<ExtractedProject> {
    this.log(`Starting project extraction from: ${filename}`);
    onProgress?.('Initializing', 0);

    try {
      const model = quality === 'low' ? MODELS.fast : quality === 'medium' ? MODELS.default : MODELS.best;
      const reasoningEffort = quality === 'low' ? 'low' : (quality === 'medium' ? 'medium' : 'high');
      const verbosity = quality === 'low' ? 'low' : (quality === 'medium' ? 'medium' : 'high');
      const ext = filename.split('.').pop()?.toLowerCase();
      onProgress?.('Analyzing file type', 10);
      
      if (ext === 'pdf') {
        // For PDF files, use OpenAI file processing
        onProgress?.('Uploading PDF to AI service', 20);
        const fileId = await openaiFileService.processFileForAI(
          buffer,
          filename,
          organizationId
        );

        this.log(`PDF file uploaded to OpenAI: ${fileId}`);
        onProgress?.('Analyzing PDF content with AI', 40);

        // Extract project data using AI with file input
        const extractedData = await this.callAIWithFiles(
          model,
          this.getExtractionSystemPrompt(),
          [
            this.createFileInput(fileId),
            this.createTextInput(this.getExtractionUserPrompt())
          ],
          ExtractedProjectSchema,
          'extractProjectFromDocument',
          'project',
          {
            reasoningEffort: reasoningEffort,
            verbosity: verbosity
          }
        );

        onProgress?.('Project data extracted', 80);
        this.log(`Successfully extracted project data from PDF: ${extractedData.title}`);
        this.log(`Extracted data:`, 'info');
        this.log(`- Title: ${extractedData.title}`, 'info');
        this.log(`- Industry: ${extractedData.industry}`, 'info');
        this.log(`- Domain: ${extractedData.domain}`, 'info');
        this.log(`- Difficulty: ${extractedData.difficulty}`, 'info');
        this.log(`- Estimated Hours: ${extractedData.estimatedHours}`, 'info');
        this.log(`- Deliverables: ${extractedData.deliverables.length} items`, 'info');
        return extractedData;
        
      } else {
        // For DOCX and other text-extractable files, extract text first
        onProgress?.('Extracting text from document', 20);
        const textContent = await this.extractTextFromFile(buffer, filename);
        this.log(`Extracted ${textContent.length} characters from ${filename}`);
        onProgress?.('Processing content with AI', 40);

        // Log the first 500 characters for debugging
        this.log(`Document content preview: ${textContent.substring(0, 500)}...`, 'info');

        // Process the extracted text with AI
        const extractedData = await this.callAI(
          model,
          [
            {
              role: 'system',
              content: this.getExtractionSystemPrompt()
            },
            {
              role: 'user',
              content: `${this.getExtractionUserPrompt()}\n\n--- DOCUMENT CONTENT ---\n${textContent}`
            }
          ],
          ExtractedProjectSchema,
          'extractProjectFromDocument',
          'project',
          {
            reasoningEffort: reasoningEffort,
            verbosity: verbosity
          }
        );

        onProgress?.('Project data extracted', 80);
        this.log(`Successfully extracted project data from ${(ext || 'unknown').toUpperCase()}`);
        
        // Enhanced debugging - check if extractedData is valid
        if (!extractedData) {
          this.log(`ERROR: extractedData is null or undefined`, 'error');
          throw new Error('AI returned null or undefined response');
        }
        
        this.log(`Extracted data structure:`, 'info');
        this.log(JSON.stringify(extractedData, null, 2), 'info');
        
        if (!extractedData.title) {
          this.log(`ERROR: extractedData.title is missing or null`, 'error');
          this.log(`Available properties: ${Object.keys(extractedData)}`, 'error');
          throw new Error('AI response missing required title field');
        }
        
        this.log(`- Title: ${extractedData.title}`, 'info');
        this.log(`- Industry: ${extractedData.industry}`, 'info');
        this.log(`- Domain: ${extractedData.domain}`, 'info');
        this.log(`- Difficulty: ${extractedData.difficulty}`, 'info');
        this.log(`- Estimated Hours: ${extractedData.estimatedHours}`, 'info');
        this.log(`- Deliverables: ${extractedData.deliverables?.length || 0} items`, 'info');
        
        return extractedData;
      }

    } catch (error) {
      this.log(`Error extracting project from ${filename}: ${error}`, 'error');
      throw error instanceof AIError ? error : new AIError(
        AIErrorType.PROCESSING,
        `Failed to extract project from document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate an image for the project using AI
   */
  async generateProjectImage(imagePrompt: string, projectTitle: string, quality: 'low' | 'medium' | 'high'): Promise<string> {
    this.log(`Generating image for project: ${projectTitle}`);

    try {
      const response = await this.client.images.generate({
        model: MODELS.image,
        prompt: `Professional project illustration: ${imagePrompt}. Modern, clean, educational style. No text or logos. High quality digital art.`,
        size: '1024x1024',
        quality: quality,
        n: 1,
      });

      // Handle both URL and buffer responses
      const imageData = response.data?.[0];
      if (!imageData) {
        throw new Error('No image data returned from AI service');
      }

      let imageUrl: string;
      
      if ('url' in imageData && imageData.url) {
        // Direct URL response
        imageUrl = imageData.url;
      } else if ('b64_json' in imageData && imageData.b64_json) {
        // Base64 response - convert to data URL
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else {
        throw new Error('No valid image URL or data returned from AI service');
      }

      this.log(`Successfully generated image for: ${projectTitle}`);
      return imageUrl;

    } catch (error) {
      this.log(`Error generating image for ${projectTitle}: ${error}`, 'error');
      throw new AIError(
        AIErrorType.API_ERROR,
        `Failed to generate project image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * System prompt for project extraction
   */
  private getExtractionSystemPrompt(): string {
    return `You are an expert project analyst that extracts educational project specifications from documents.

Your task is to:
1. Extract key project information from the document
2. Generalize and anonymize the content (remove specific company names, personal names, proprietary information)
3. Transform the content into an educational project suitable for students
4. Ensure all extracted data follows the specified format

Guidelines:
- Remove all company names, replace with generic terms like "a technology company", "the organization", etc.
- Remove personal names and contact information
- Focus on the core technical and educational aspects
- Make the project scope appropriate for educational use
- Estimate realistic timeframes for student completion
- Create clear, actionable deliverables
- Generate an appropriate image prompt that represents the project visually

Be thorough but concise. Focus on creating a meaningful learning experience.`;
  }

  /**
   * User prompt for project extraction
   */
  private getExtractionUserPrompt(): string {
    return `Analyze this document and extract project information. Create an educational project specification with these requirements:

1. **Title**: Clear, descriptive project name (remove company-specific branding)
2. **Description**: Comprehensive overview of what students will build/learn (2-3 paragraphs)
3. **Scope**: Specific boundaries and what's included/excluded in the project
4. **Industry**: Primary industry category (e.g., Technology, Healthcare, Finance, Manufacturing, etc.)
5. **Domain**: Technical domain (e.g., Web Development, Mobile Apps, Data Science, AI/ML, Cybersecurity, etc.)
6. **Difficulty**: Assess as beginner, intermediate, or advanced based on complexity
7. **Estimated Hours**: Realistic time estimate for student completion (consider skill level)
8. **Deliverables**: Specific, measurable outputs students will create (minimum 3)
9. **Image Prompt**: Descriptive prompt for generating a representative project image

Important: 
- Anonymize all content - remove company names, personal names, proprietary details
- Make it educational and generalized
- Ensure the scope is appropriate for the estimated hours and difficulty level
- Deliverables should be concrete and assessable

Extract this information and return it in the specified JSON format.`;
  }
}

// Export singleton instance
export const projectExtractionService = new ProjectExtractionService();
