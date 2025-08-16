import { NextRequest } from 'next/server';
import { API } from '@/lib/server';
import { AuthBridge } from '@/lib/auth-bridge';
import { auth } from '@/lib/auth';

const SYNC_AUTH_ENDPOINTS = new Set([
  '/api/auth/current-user',
  '/api/auth/organizations',
  '/api/auth/check-permission',
  '/api/auth/switch-context',
  '/api/auth/logout',
]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  const isSyncEndpoint = SYNC_AUTH_ENDPOINTS.has(path);

  if (!isSyncEndpoint) {
    return auth.handler(request);
  }

  // Sync-backed auth endpoints (bridge + engine)
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const enrichedHeaders = await AuthBridge.enrichRequestHeaders(request);

  const result = await API.request({
    method: 'GET',
    path,
    query: searchParams,
    headers: enrichedHeaders,
  });

  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  const raced = (await API._waitForResponse({ request: result.request, timeoutMs: 5000 })) as any[];
  if (!Array.isArray(raced) || raced.length === 0) {
    return new Response(null, { status: 204 });
  }
  const data = raced[0] as any;
  return Response.json(data.body || data, { status: data.statusCode || data.status || 200 });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  const isSyncEndpoint = SYNC_AUTH_ENDPOINTS.has(path);

  if (!isSyncEndpoint) {
    return auth.handler(request);
  }

  // Handle logout explicitly by invoking better-auth signOut to clear cookies
  if (path === '/api/auth/logout') {
    try {
      await auth.api.signOut({ headers: request.headers });
    } catch (e) {
      // ignore
    }
  }

  const body = await request.json().catch(() => ({}));
  let headers = await AuthBridge.enrichRequestHeaders(request);
  // include relevant context keys from body if present
  if (body.contextId) headers['x-context-id'] = body.contextId;
  if (body.resource) headers['x-resource'] = body.resource;
  if (body.action) headers['x-action'] = body.action;
  if (body.roles) headers['x-roles'] = JSON.stringify(body.roles);

  const result = await API.request({ method: 'POST', path, body, headers });
  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 500 });
  }
  const raced = (await API._waitForResponse({ request: result.request, timeoutMs: 5000 })) as any[];
  if (!Array.isArray(raced) || raced.length === 0) {
    return new Response(null, { status: 204 });
  }
  const data = raced[0] as any;
  return Response.json(data.body || data, { status: data.statusCode || data.status || 200 });
}


