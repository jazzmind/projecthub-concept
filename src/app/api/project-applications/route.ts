import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      projectId,
      applicantName,
      applicantEmail,
      applicantImage,
      linkedinUrl,
      message,
      videoUrl,
      appliedAt
    } = await request.json();

    // Validate required fields
    if (!projectId || !applicantName || !applicantEmail || !linkedinUrl || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has already applied to this project
    const existingApplication = await prisma.projectApplication.findFirst({
      where: {
        projectId,
        applicantEmail
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this project' },
        { status: 409 }
      );
    }

    // Create the application
    const application = await prisma.projectApplication.create({
      data: {
        projectId,
        applicantName,
        applicantEmail,
        applicantImage,
        linkedinUrl,
        message,
        videoUrl,
        status: 'pending',
        appliedAt: new Date(appliedAt)
      }
    });

    return NextResponse.json({ 
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });

  } catch (error) {
    console.error('Error creating project application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    let whereClause: any = {};

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (userId) {
      whereClause.applicantEmail = session.user.email;
    }

    const applications = await prisma.projectApplication.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            industry: true,
            domain: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true,
      applications 
    });

  } catch (error) {
    console.error('Error fetching project applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
