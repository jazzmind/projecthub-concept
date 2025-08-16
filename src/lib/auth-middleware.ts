import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS, ROLES } from '@/lib/auth-context';
import { auth } from '@/lib/auth';

/**
 * Route Authorization Middleware Utilities
 *
 * Purpose
 *   - Provide simple, fast path protection at the Next.js edge using Better Auth
 *     for session detection. Heavy RBAC logic is deferred to server-side
 *     synchronizations so middleware remains lean and stateless.
 *
 * Sync vs Async
 *   - Uses Better Auth's async session lookup (may hit DB/crypto). Keep checks
 *     minimal to reduce latency.
 *   - Avoid importing the concept engine here to keep the edge bundle small and
 *     compatible; server-side handlers can use the sync engine instead.
 *
 * See also
 *   - docs/auth-usage.md for route protection patterns
 *   - docs/architecture.md for how auth integrates with the concept engine
 */

// Route configuration for permissions
interface RouteConfig {
  path: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requiresAuth?: boolean;
  isPublic?: boolean;
}

// Route permission configurations
export const ROUTE_CONFIGS: RouteConfig[] = [
  // Public routes (no auth required)
  { path: '/', isPublic: true },
  { path: '/login', isPublic: true },
  { path: '/register', isPublic: true },
  { path: '/forgot-password', isPublic: true },
  { path: '/api/auth/*', isPublic: true },
  
  // Protected routes with specific permissions
  { 
    path: '/dashboard', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.ORGANIZATIONS.READ]
  },
  { 
    path: '/organizations', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.ORGANIZATIONS.READ]
  },
  { 
    path: '/organizations/create', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.ORGANIZATIONS.CREATE],
    requiredRoles: [ROLES.PLATFORM_ADMIN, ROLES.ORG_ADMIN]
  },
  { 
    path: '/campaigns', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.CAMPAIGNS.READ]
  },
  { 
    path: '/campaigns/create', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.CAMPAIGNS.CREATE],
    requiredRoles: [ROLES.ORG_ADMIN, ROLES.EDUCATOR]
  },
  { 
    path: '/projects', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.PROJECTS.READ]
  },
  { 
    path: '/projects/create', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.PROJECTS.CREATE],
    requiredRoles: [ROLES.ORG_ADMIN, ROLES.EDUCATOR]
  },
  { 
    path: '/teams', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.TEAMS.READ]
  },
  { 
    path: '/teams/create', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.TEAMS.CREATE]
  },
  { 
    path: '/experts', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.PROFILES.READ]
  },
  { 
    path: '/partners', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.PROFILES.READ]
  },
  
  // API routes protection
  { 
    path: '/api/organizations', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.ORGANIZATIONS.READ]
  },
  { 
    path: '/api/campaigns', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.CAMPAIGNS.READ]
  },
  { 
    path: '/api/projects', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.PROJECTS.READ]
  },
  { 
    path: '/api/teams', 
    requiresAuth: true,
    requiredPermissions: [PERMISSIONS.TEAMS.READ]
  }
];

/**
 * Check if a route matches a pattern (supports wildcards)
 *
 * Synchronous pure helper used by middleware to resolve the configured rule
 * for a request path without any side effects.
 */
function matchesRoute(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    const basePattern = pattern.slice(0, -1);
    return pathname.startsWith(basePattern);
  }
  return pathname === pattern;
}

/**
 * Find route configuration for a given pathname
 *
 * Synchronous pure helper to pick the most appropriate rule.
 */
function findRouteConfig(pathname: string): RouteConfig | null {
  return ROUTE_CONFIGS.find(config => matchesRoute(pathname, config.path)) || null;
}

/**
 * Middleware function to protect routes
 *
 * Minimal policy
 *   - Public routes pass through
 *   - Protected routes require a Better Auth session; otherwise redirect to /login
 *   - We add a compact `x-auth-user` header so downstream server code can read
 *     identity quickly; detailed RBAC stays server-side via synchronizations.
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const routeConfig = findRouteConfig(pathname);
  
  // If no specific config and not public, require auth by default
  const requiresAuth = routeConfig?.requiresAuth ?? !routeConfig?.isPublic;
  
  // Allow public routes
  if (routeConfig?.isPublic) {
    return null; // Continue to route
  }

  if (!requiresAuth) {
    return null; // Continue to route
  }

  try {
    // Get better-auth session (simplified for middleware)
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      // Redirect to login for protected routes
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For middleware, we do basic auth check only
    // Full RBAC will be handled by the sync-based auth system
    const basicAuthUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isAuthenticated: true
    };

    // Add basic auth info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-auth-user', JSON.stringify(basicAuthUser));
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

/**
 * Server-side auth check for API routes (using sync bridge)
 * This will be lazy-imported to avoid bundling sync engine in middleware
 */
export async function requireAuth(request: Request): Promise<{
  user: any;
  error?: string;
}> {
  try {
    // Lazy import the bridge to avoid sync engine in middleware
    const { AuthBridge } = await import('@/lib/auth-bridge');
    const authUser = await AuthBridge.getCurrentAuthUser(request);
    
    if (!authUser) {
      return { user: null, error: 'Authentication required' };
    }
    
    return { user: authUser };
  } catch (error) {
    console.error('Auth check error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Check permissions for API routes (using sync bridge)
 *
 * Note: This performs a simplified, environment-driven check via AuthBridge
 * for convenience. Prefer delegating nuanced permission decisions to the
 * concept engine synchronizations or queries in server handlers.
 */
export async function requirePermission(
  request: Request,
  resource: string,
  action: string
): Promise<{
  user: any;
  hasPermission: boolean;
  error?: string;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.user) {
    return { user: null, hasPermission: false, error: authResult.error };
  }
  
  // Lazy import the bridge
  const { AuthBridge } = await import('@/lib/auth-bridge');
  const hasPermission = await AuthBridge.hasPermission(request, resource, action);
  
  return {
    user: authResult.user,
    hasPermission,
    error: hasPermission ? undefined : 'Insufficient permissions'
  };
}

/**
 * Check roles for API routes (using sync bridge)
 */
export async function requireRole(
  request: Request,
  roles: string[]
): Promise<{
  user: any;
  hasRole: boolean;
  error?: string;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.user) {
    return { user: null, hasRole: false, error: authResult.error };
  }
  
  // Lazy import the bridge
  const { AuthBridge } = await import('@/lib/auth-bridge');
  const hasRole = await AuthBridge.hasRole(request, roles);
  
  return {
    user: authResult.user,
    hasRole,
    error: hasRole ? undefined : 'Insufficient role'
  };
}
