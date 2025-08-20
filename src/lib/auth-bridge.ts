import { auth } from '@/lib/auth';

/**
 * Better-Auth Session Bridge
 *
 * Purpose
 *   - Provide a very thin, stateless bridge between Better Auth (session/cookies)
 *     and the rest of our app (Next.js routes, concept engine APIs, and clients).
 *   - Extracts, normalizes and forwards auth/session signals as HTTP headers so
 *     server handlers can remain framework-agnostic.
 *
 * What this is NOT
 *   - This file does NOT import or call the concept engine or synchronizations.
 *   - No RBAC decisions are made here beyond a minimal, environment-based
 *     heuristic used only for bootstrapping and simple guards. Full RBAC lives
 *     in synchronizations (see docs and `src/lib/server.ts`).
 *
 * Sync vs Async
 *   - Async: Anything that reaches into Better Auth (network/DB/crypto) such as
 *     `auth.api.getSession` or `signOut` must be async and may throw. We wrap
 *     these in try/catch and return null or no-ops on failure so callers can
 *     degrade gracefully.
 *   - Sync: Header manipulation and string parsing are synchronous, pure
 *     operations; we keep them side‑effect free.
 *
 * See also
 *   - docs/auth-usage.md for higher-level usage patterns
 *   - docs/architecture.md for how auth interacts with the concept engine
 */

export interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

export class AuthBridge {
  /**
   * Build a minimal initial user object from a header-based session
   * Used by server components (e.g., layout) to pre-hydrate client AuthProvider
   */
  static async getInitialUserFromHeaderObject(h: Record<string, string>): Promise<any | null> {
    try {
      const plain = new Headers(h);
      const session: any = await auth.api.getSession({ headers: plain });
      if (!session) return null;
      // Prefer fields provided by customSession plugin (currentContext, effectiveRole)
      const currentContext = session.currentContext ?? {};
      const effectiveRole = session.effectiveRole ?? {
        name: 'guest',
        displayName: 'Guest',
        scope: 'public',
        permissions: {},
      };

      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        isActive: true,
        currentContext,
        effectiveRole,
        availableOrganizations: session.availableOrganizations ?? [],
      };
    } catch (error) {
      console.error('Error building initial user from headers:', error);
      return null;
    }
  }
  /**
   * Get Better Auth session for a Request
   *
   * Async because it calls Better Auth APIs which may hit DB/crypto.
   * Returns null on failure so callers can treat "no session" and
   * "session fetch failed" uniformly.
   */
  static async getBetterAuthSession(request: Request): Promise<BetterAuthSession | null> {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      return session as BetterAuthSession;
    } catch (error) {
      console.error('Error getting better-auth session:', error);
      return null;
    }
  }

  /**
   * Get Better Auth session from a plain header object (e.g. Next.js headers())
   *
   * Avoids dynamic headers() constraints by copying into a standard Headers
   * instance that Better Auth expects.
   */
  static async getSessionFromHeaderObject(h: Record<string, string>): Promise<BetterAuthSession | null> {
    try {
      // Convert to a plain Headers instance to avoid dynamic headers() constraints
      const plain = new Headers(h);
      const session = await auth.api.getSession({ headers: plain });
      return session as BetterAuthSession;
    } catch (error) {
      console.error('Error getting session from header object:', error);
      return null;
    }
  }


  /**
   * Extract a session key from cookies or Authorization header
   *
   * This helps us map a Better Auth session to a generic `x-session-key` header
   * consumed by concept synchronizations that are intentionally framework-agnostic.
   */
  static extractSessionKey(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
      if (match) return match[1];
    }
    
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  /**
   * Enrich a Request's headers with auth/session hints
   *
   * Adds `x-user-id`, `x-user-email`, `x-user-name`, and `x-session-key` if a
   * Better Auth session is present. This preserves the original headers and
   * returns a plain object suitable for forwarding in fetch or API calls.
   */
  static async enrichRequestHeaders(request: Request): Promise<Record<string, string>> {
    const headers = Object.fromEntries(request.headers.entries());
    
    const betterAuthSession = await AuthBridge.getBetterAuthSession(request);
    if (betterAuthSession) {
      const sessionKey = AuthBridge.extractSessionKey(request) || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      headers['x-user-id'] = betterAuthSession.user.id;
      headers['x-user-email'] = betterAuthSession.user.email;
      headers['x-user-name'] = betterAuthSession.user.name;
      headers['x-session-key'] = sessionKey;
    }
    
    return headers;
  }

  /**
   * Check if a Request has a valid Better Auth session
   */
  static async hasValidSession(request: Request): Promise<boolean> {
    const session = await AuthBridge.getBetterAuthSession(request);
    return session !== null;
  }

  /**
   * Sign out of Better Auth for a given Request
   *
   * Async because Better Auth will update server-side session/cookies.
   */
  static async logout(request: Request): Promise<void> {
    try {
      await auth.api.signOut({ headers: request.headers });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Optionally transform a Response to preserve auth cookies/headers
   *
   * For auth endpoints, Better Auth sets cookies internally. In most cases we
   * simply return the Response as-is so Next.js can flush those headers. This
   * hook exists to centralize any future adjustments.
   */
  static async transformResponse(
    request: Request, 
    response: Response, 
    isAuthEndpoint: boolean = false
  ): Promise<Response> {
    try {
      // If this is an auth endpoint (login, registration, etc.), we might need to set cookies
      if (isAuthEndpoint) {
        // For auth endpoints, better-auth might have set cookies that we need to preserve
        // This is handled automatically by better-auth, but we can add custom logic here if needed
        return response;
      }
      
      // For non-auth endpoints, just return the response as-is
      return response;
    } catch (error) {
      console.error('Error transforming response:', error);
      return response;
    }
  }

  /**
   * Extract concise session info for logging/debugging
   */
  static async getSessionInfo(request: Request): Promise<{
    hasSession: boolean;
    userId?: string;
    email?: string; 
    image?: string;
  }> {
    const session = await AuthBridge.getBetterAuthSession(request);
    return {
      hasSession: session !== null,
      userId: session?.user?.id,
      email: session?.user?.email,
      image: session?.user?.image,
    };
  }

  /**
   * Return a lightweight authenticated user derived from Better Auth
   *
   * Useful for API handlers that only need identity (id/email/name) and defer
   * role/context resolution to the sync engine.
   */
  static async getCurrentAuthUser(request: Request): Promise<{
    id: string;
    email: string;
    name: string;
    image: string;
  } | null> {
    const session = await AuthBridge.getBetterAuthSession(request);
    if (!session) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image || "",
    };
  }

  /**
   * Minimal permission check wrapper
   *
   * This is intentionally simplistic and environment-driven. It allows us to
   * protect basic routes quickly, but it is not the authoritative RBAC model.
   * For full RBAC (hierarchical roles, contexts, and permissions), see the
   * synchronizations registered in `src/lib/server.ts`.
   */
  static async hasPermission(request: Request, resource: string, action: string): Promise<boolean> {
    const session = await AuthBridge.getBetterAuthSession(request);
    if (!session) return false;

    const userEmail = session.user.email?.toLowerCase() || '';
    const adminUsers = (process.env.ADMIN_USERS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const autoDomain = (process.env.AUTO_REGISTER_DOMAIN || '').toLowerCase();

    let roleName = 'guest';
    if (userEmail && adminUsers.includes(userEmail)) {
      roleName = 'platform_admin';
    } else if (autoDomain && userEmail.endsWith(`@${autoDomain}`)) {
      roleName = 'manager';
    }

    if (roleName === 'platform_admin') return true;

    // Very basic defaults for manager role
    if (roleName === 'manager') {
      const readable = ['organizations', 'campaigns', 'projects', 'teams', 'profiles'];
      if (action === 'read' && readable.includes(resource)) return true;
      const creatable = ['campaigns', 'projects'];
      if (action === 'create' && creatable.includes(resource)) return true;
    }

    // Fallback: no permission
    return false;
  }

  /**
   * Minimal role check wrapper using the same heuristic as hasPermission
   */
  static async hasRole(request: Request, roles: string[]): Promise<boolean> {
    const session = await AuthBridge.getBetterAuthSession(request);
    if (!session) return false;

    const userEmail = session.user.email?.toLowerCase() || '';
    const adminUsers = (process.env.ADMIN_USERS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const autoDomain = (process.env.AUTO_REGISTER_DOMAIN || '').toLowerCase();

    let roleName = 'guest';
    if (userEmail && adminUsers.includes(userEmail)) {
      roleName = 'platform_admin';
    } else if (autoDomain && userEmail.endsWith(`@${autoDomain}`)) {
      roleName = 'manager';
    }

    return roles.includes(roleName);
  }

}


