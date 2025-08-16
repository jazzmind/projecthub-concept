import { NextRequest, NextResponse } from 'next/server';
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
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = ExtractRequestSchema.parse(body);
    
    // Convert array back to Buffer
    const fileBuffer = Buffer.from(validatedData.fileBuffer);
    
    // Extract project from document
    const result = await projectConcept.extractFromDocument({
      fileBuffer,
      originalFilename: validatedData.originalFilename,
      organizationId: validatedData.organizationId,
      quality: validatedData.quality,
    });
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { project: result.project },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error in project extraction API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Invalid request: ${error.errors.map(e => e.message).join(', ')}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error during project extraction' },
      { status: 500 }
    );
  }
}
