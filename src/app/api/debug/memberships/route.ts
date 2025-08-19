import { NextRequest } from 'next/server';
import { AuthBridge } from '@/lib/auth-bridge';

export async function GET(request: NextRequest) {
  try {
    // Get better-auth session
    const betterAuthSession = await AuthBridge.getBetterAuthSession(request);
    
    if (!betterAuthSession) {
      return Response.json({ error: 'No session found' }, { status: 401 });
    }

    const userId = betterAuthSession.user.id;

    // Import concepts for direct database queries
    const { Membership, Organization, Role, Session } = await import('@/lib/server');

    // Get user's memberships directly from database
    const allMemberships = await Membership._getByMemberEntity({ 
      memberEntityType: 'user', 
      memberEntityId: userId,
      isActive: undefined
    });

    const activeMemberships = await Membership._getByMemberEntity({ 
      memberEntityType: 'user', 
      memberEntityId: userId,
      isActive: true
    });

    // Get organizations the user belongs to
    const organizations = [];
    for (const membership of activeMemberships) {
      if (membership.targetEntityType === 'organization') {
        const orgs = await Organization._getById({ id: membership.targetEntityId });
        if (orgs.length > 0) {
          organizations.push({
            membership,
            organization: orgs[0]
          });
        }
      }
    }

    // Get user's session info from our concept system
    const sessionKey = AuthBridge.extractSessionKey(request);
    let conceptSession = null;
    if (sessionKey) {
      const sessions = await Session._getBySessionKey({ sessionKey });
      conceptSession = sessions[0] || null;
    }

    // Get all available roles for reference
    const allRoles = [];
    for (const membership of allMemberships) {
      try {
        const role = await Role._getById({ id: membership.roleEntityId });
        if (role) {
          allRoles.push(role);
        }
      } catch (e) {
        console.warn('Failed to get role for membership:', membership.id);
      }
    }

    const debugInfo = {
      userId,
      sessionKey,
      allMemberships,
      activeMemberships,
      organizations,
      conceptSession,
      allRoles,
      timestamp: new Date().toISOString()
    };

    return Response.json(debugInfo);
  } catch (error) {
    console.error('Error in memberships debug endpoint:', error);
    return Response.json(
      { error: `Failed to get memberships: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
