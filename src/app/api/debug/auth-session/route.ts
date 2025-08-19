import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth session debug endpoint called');
    
    // Get Better Auth session
    const session = await auth.api.getSession({ headers: request.headers });
    console.log('Better Auth session:', session ? 'found' : 'not found');
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        hasAuth: false
      });
    }

    // Check concept session
    const conceptSession = await prisma.session.findFirst({ 
      where: { userId: session.userId } 
    });
    console.log('Concept session:', conceptSession ? 'found' : 'not found');

    // Check memberships
    const memberships = await prisma.membership.findMany({ 
      where: { 
        memberEntityType: 'user', 
        memberEntityId: session.userId, 
        isActive: true 
      } 
    });
    console.log('Memberships found:', memberships.length);

    // Check organizations
    const organizations = await prisma.organization.findMany({
      where: { 
        id: { 
          in: memberships
            .filter(m => m.targetEntityType === 'organization')
            .map(m => m.targetEntityId) 
        } 
      }
    });
    console.log('Organizations found:', organizations.length);

    // Check roles
    const roles = await prisma.role.findMany();
    console.log('Roles in database:', roles.length);

    // Check users
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    console.log('User found:', user ? 'yes' : 'no');

    // Environment check
    const adminUsers = (process.env.ADMIN_USERS || "").split(",").map(e => e.trim());
    const isAdmin = adminUsers.includes(session.user.email);
    console.log('Admin users configured:', adminUsers.length, 'Is admin:', isAdmin);

    return NextResponse.json({
      success: true,
      debug: {
        betterAuthSession: {
          found: !!session,
          userId: session.userId,
          userEmail: session.user.email,
          sessionId: session.session.id
        },
        conceptSession: {
          found: !!conceptSession,
          id: conceptSession?.id,
          hasContext: !!conceptSession?.currentContext,
          context: conceptSession?.currentContext
        },
        memberships: {
          count: memberships.length,
          organizations: memberships.filter(m => m.targetEntityType === 'organization').length,
          campaigns: memberships.filter(m => m.targetEntityType === 'campaign').length
        },
        organizations: {
          count: organizations.length,
          names: organizations.map(o => o.name)
        },
        roles: {
          count: roles.length,
          names: roles.map(r => r.displayName)
        },
        environment: {
          adminUsersConfigured: adminUsers.length,
          isAdmin,
          nodeEnv: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
        },
        user: {
          found: !!user,
          email: user?.email,
          isActive: user?.isActive
        }
      }
    });

  } catch (error) {
    console.error('Auth session debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
