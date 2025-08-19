// handle getting a list of projects for an organization

import { NextRequest, NextResponse } from 'next/server';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { RelationshipConcept } from '@/lib/concepts/common/relationship';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers() // you need to pass the headers object.
    });
    const projectConcept = new ProjectConcept();
    
    // if no session, return 401
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // if no organizationId, return 400
    if (!session.currentContext.organizationId) {
        return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    // Parse query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Parse filters
    const filters: any = {};
    const industry = url.searchParams.get('industry');
    const domain = url.searchParams.get('domain');
    const status = url.searchParams.get('status');
    const difficulty = url.searchParams.get('difficulty');

    if (industry) filters.industry = industry;
    if (domain) filters.domain = domain;
    if (status) filters.status = status;
    if (difficulty) filters.difficulty = difficulty;

    // Get paginated projects
    const result = await projectConcept._getByOrganizationPaginated({
        organizationId: session.currentContext.organizationId,
        skip,
        take: limit,
        filters: Object.keys(filters).length > 0 ? filters : undefined
    });

    return NextResponse.json({
        projects: result.projects,
        pagination: {
            page,
            limit,
            total: result.total,
            hasMore: result.hasMore,
            totalPages: Math.ceil(result.total / limit)
        }
    });
}

