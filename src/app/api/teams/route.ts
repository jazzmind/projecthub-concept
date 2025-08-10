import { NextRequest } from 'next/server';
import { Team } from '@/lib/server';

export async function GET(request: NextRequest) {
  try {
    const teams = await Team._getActiveTeams();
    return Response.json({ teams });
  } catch (error) {
    console.error('GET /api/teams error:', error);
    return Response.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await Team.create({
      name: body.name,
      description: body.description,
      campaignId: body.campaignId,
      maxStudents: body.maxStudents,
      teamType: body.teamType,
      isPublic: body.isPublic,
      requiresApproval: body.requiresApproval
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    
    return Response.json({ team: result.team });
  } catch (error) {
    console.error('POST /api/teams error:', error);
    return Response.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
