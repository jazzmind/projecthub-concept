import { NextRequest } from 'next/server';
import { Project } from '@/lib/server';

export async function GET(request: NextRequest) {
  try {
    const projects = await Project._getByStatus({ status: 'active' });
    return Response.json({ projects });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await Project.create({
      title: body.title,
      description: body.description,
      scope: body.scope,
      learningObjectives: body.learningObjectives,
      industry: body.industry,
      domain: body.domain,
      difficulty: body.difficulty,
      estimatedHours: body.estimatedHours,
      requiredSkills: body.requiredSkills,
      deliverables: body.deliverables
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    
    return Response.json({ project: result.project });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return Response.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
