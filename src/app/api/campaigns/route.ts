import { NextRequest } from 'next/server';
import { Campaign } from '@/lib/server';

export async function GET(request: NextRequest) {
  try {
    const campaigns = await Campaign._getActive();
    return Response.json({ campaigns });
  } catch (error) {
    console.error('GET /api/campaigns error:', error);
    return Response.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await Campaign.create({
      name: body.name,
      description: body.description,
      educationOrganizationId: body.educationOrganizationId,
      learningObjectives: body.learningObjectives,
      startDate: new Date(body.startDate),
      contactEmail: body.contactEmail
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    
    return Response.json({ campaign: result.campaign });
  } catch (error) {
    console.error('POST /api/campaigns error:', error);
    return Response.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
