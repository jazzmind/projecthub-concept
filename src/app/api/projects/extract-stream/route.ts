import { NextRequest } from 'next/server';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { z } from 'zod';

const projectConcept = new ProjectConcept();

// Schema for request validation
const ExtractRequestSchema = z.object({
  fileBuffer: z.array(z.number()), // Buffer as array of numbers for JSON serialization
  originalFilename: z.string().min(1),
  organizationId: z.string().min(1),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial response
      const initialData = JSON.stringify({ type: 'status', message: 'Starting extraction process...' });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
    },
    
    async pull(controller) {
      try {
        const body = await request.json();
        
        // Validate request body
        const validatedData = ExtractRequestSchema.parse(body);
        
        // Convert array back to Buffer
        const fileBuffer = Buffer.from(validatedData.fileBuffer);
        
        // Create progress callback
        const onProgress = (stage: string, progress: number) => {
          const progressData = JSON.stringify({ 
            type: 'progress', 
            stage, 
            progress 
          });
          controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
        };
        
        // Extract project from document
        const result = await projectConcept.extractFromDocument({
          fileBuffer,
          originalFilename: validatedData.originalFilename,
          organizationId: validatedData.organizationId,
          quality: validatedData.quality,
          onProgress,
        });
        
        if ('error' in result) {
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: result.error 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } else {
          const successData = JSON.stringify({ 
            type: 'success', 
            project: result.project 
          });
          controller.enqueue(encoder.encode(`data: ${successData}\n\n`));
        }
        
        // Close the stream
        controller.close();
        
      } catch (error) {
        console.error('Error in streaming project extraction API:', error);
        
        let errorMessage = 'Internal server error during project extraction';
        if (error instanceof z.ZodError) {
          errorMessage = `Invalid request: ${error.errors.map(e => e.message).join(', ')}`;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        const errorData = JSON.stringify({ 
          type: 'error', 
          error: errorMessage 
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
