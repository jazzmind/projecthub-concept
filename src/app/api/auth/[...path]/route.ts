import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Helper: extract Better Auth session token (same logic as bridge)
function extractSessionKey(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    if (match) return match[1];
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  return null;
}

async function getBetterAuthSession(request: NextRequest) {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch {
    return null;
  }
}

async function buildCurrentUserPayload(request: NextRequest) {
  const session = await getBetterAuthSession(request);
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isActive: true,
    currentContext: session.currentContext ?? {},
    effectiveRole: session.effectiveRole ?? null,
    availableOrganizations: session.availableOrganizations ?? [],
  };
  
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/auth/current-user') {
    const payload = await buildCurrentUserPayload(request);
    if (!payload) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    return Response.json(payload, { status: 200 });
  }

  if (path === '/api/auth/organizations') {
    const session = await getBetterAuthSession(request);
    if (!session) return Response.json({ organizations: [] }, { status: 200 });
    const userId = session.user.id;
    const memberships = await prisma.membership.findMany({
      where: { memberEntityType: 'user', memberEntityId: userId, targetEntityType: 'organization', isActive: true }
    });
    const organizations = [] as Array<{ id: string; name: string; domain: string; type: string; role: string }>;
    for (const m of memberships) {
      const org = await prisma.organization.findUnique({ where: { id: m.targetEntityId } });
      if (org) {
        let roleCode = 'member';
        try {
          const role = await prisma.role.findUnique({ where: { id: m.roleEntityId } });
          if (role?.displayName) roleCode = role.displayName.toLowerCase().replace(/\s+/g, '_');
        } catch {}
        organizations.push({ id: org.id, name: org.name, domain: org.domain, type: org.organizationType, role: roleCode });
      }
    }
    return Response.json({ organizations }, { status: 200 });
  }

  if (path === '/api/auth/campaigns') {
    const session = await getBetterAuthSession(request);
    if (!session) return Response.json({ campaigns: [] }, { status: 200 });
    const userId = session.user.id;
    const memberships = await prisma.membership.findMany({
      where: { memberEntityType: 'user', memberEntityId: userId, targetEntityType: 'campaign', isActive: true }
    });
    const campaigns: Array<{ id: string; name: string; role: string }> = [];
    for (const m of memberships) {
      const camp = await prisma.campaign.findUnique({ where: { id: m.targetEntityId } });
      if (camp) {
        let roleCode = 'member';
        try {
          const role = await prisma.role.findUnique({ where: { id: m.roleEntityId } });
          if (role?.displayName) roleCode = role.displayName.toLowerCase().replace(/\s+/g, '_');
        } catch {}
        campaigns.push({ id: camp.id, name: camp.name, role: roleCode });
      }
    }
    return Response.json({ campaigns }, { status: 200 });
  }

  // Fallback to better-auth handler for other auth routes
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/auth/switch-context') {
    const body = await request.json().catch(() => ({} as any));
    const session = await getBetterAuthSession(request);
    if (!session) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    const token = extractSessionKey(request);
    const userId = session.user.id;
    const contextId = String(body.contextId || '').trim();
    if (!contextId) return Response.json({ error: 'contextId required' }, { status: 400 });

    // Verify access
    const membership = await prisma.membership.findFirst({
      where: { memberEntityType: 'user', memberEntityId: userId, targetEntityType: 'organization', targetEntityId: contextId, isActive: true }
    });
    if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Update session context and current role
    const role = await prisma.role.findUnique({ where: { id: membership.roleEntityId } });
    const currentRole = role?.displayName?.toLowerCase().replace(/\s+/g, '_') || 'member';
    const newContext = { organizationId: contextId, currentRole };
    if (token) {
      await prisma.session.updateMany({ where: { sessionKey: token }, data: { currentContext: JSON.stringify(newContext), lastActivityAt: new Date() } });
    }
    return Response.json({ success: true, contextId }, { status: 200 });
  }

  if (path === '/api/auth/switch-campaign') {
    const body = await request.json().catch(() => ({} as any));
    const session = await getBetterAuthSession(request);
    if (!session) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    const token = extractSessionKey(request);
    const userId = session.user.id;
    const campaignId = String(body.campaignId || '').trim();
    if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 });

    // Verify access
    const membership = await prisma.membership.findFirst({
      where: { memberEntityType: 'user', memberEntityId: userId, targetEntityType: 'campaign', targetEntityId: campaignId, isActive: true }
    });
    if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Merge into existing context
    let currentContext: any = {};
    if (token) {
      const s = await prisma.session.findFirst({ where: { sessionKey: token } });
      if (s?.currentContext) {
        try { currentContext = JSON.parse(s.currentContext); } catch {}
      }
      const role = await prisma.role.findUnique({ where: { id: membership.roleEntityId } });
      const currentRole = role?.displayName?.toLowerCase().replace(/\s+/g, '_') || currentContext.currentRole || 'member';
      const newContext = { ...currentContext, campaignId, currentRole };
      await prisma.session.updateMany({ where: { sessionKey: token }, data: { currentContext: JSON.stringify(newContext), lastActivityAt: new Date() } });
    }
    return Response.json({ success: true, campaignId }, { status: 200 });
  }

  if (path === '/api/auth/logout') {
    try {
      await auth.api.signOut({ headers: request.headers });
    } catch {}
    return new Response(null, { status: 204 });
  }

  // Fallback to better-auth for other auth POST endpoints
  return auth.handler(request);
}


