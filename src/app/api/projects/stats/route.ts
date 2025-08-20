import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ProjectConcept } from '@/lib/concepts/project/project';

interface IndustryStats {
  industry: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.currentContext?.organizationId) {
      return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
    }

    const projectConcept = new ProjectConcept();
    const stats = await projectConcept._getIndustryCountByOrganization({ organizationId: session.currentContext.organizationId });
    console.log("Stats", stats);
    // sort and filter out industries that have count = 0
    const sortedStats = stats.sort((a: { count: number }, b: { count: number }) => b.count - a.count).filter((stat: { count: number }) => stat.count > 0);
    console.log(sortedStats);

    return NextResponse.json({
      success: true,
      stats,
      totalIndustries: stats.length,
      totalProjects: stats.reduce((sum: number, stat: { count: number }) => sum + stat.count, 0),
    });

  } catch (error) {
    console.error('Error fetching industry stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
