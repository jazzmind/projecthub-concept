import { NextRequest } from 'next/server';
import { AuthBridge } from '@/lib/auth-bridge';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const betterAuthSession = await AuthBridge.getBetterAuthSession(request);
    
    if (!betterAuthSession) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Import concepts for direct database queries
    const { Organization, User, Role, Membership, Session } = await import('@/lib/server');

    // Get all organizations
    const organizations = await Organization._getTopLevel();

    // Get roles by trying common role names
    const roleNames = ['Platform Admin', 'Manager', 'Guest'];
    const roles = [];
    for (const roleName of roleNames) {
      try {
        const role = await Role._getByDisplayName({ displayName: roleName });
        if (role) roles.push(role);
      } catch (e) {
        console.warn(`Failed to get role: ${roleName}`);
      }
    }

    // Get all memberships for all users
    const memberships = await Membership._getByMemberEntity({ memberEntityType: 'user', isActive: undefined });

    // Get session info
    const sessionKey = AuthBridge.extractSessionKey(request);
    let sessions = [];
    if (sessionKey) {
      try {
        sessions = await Session._getBySessionKey({ sessionKey });
      } catch (e) {
        console.warn('Failed to get session:', e);
      }
    }

    const debugInfo = {
      counts: {
        organizations: organizations.length,
        roles: roles.length,
        memberships: memberships.length,
        sessions: sessions.length
      },
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        domain: org.domain,
        type: org.organizationType,
        createdAt: org.createdAt
      })),
      roles: roles.map(role => ({
        id: role.id,
        displayName: role.displayName,
        scope: role.scope,
        isActive: role.isActive
      })),
      memberships: memberships.map(m => ({
        id: m.id,
        memberEntityType: m.memberEntityType,
        memberEntityId: m.memberEntityId,
        targetEntityType: m.targetEntityType,
        targetEntityId: m.targetEntityId,
        status: m.status,
        isActive: m.isActive
      })),
      timestamp: new Date().toISOString()
    };

    return Response.json(debugInfo);
  } catch (error) {
    console.error('Error in database debug endpoint:', error);
    return Response.json(
      { error: `Failed to get database info: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
