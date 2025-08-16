import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { UserConcept } from "@/lib/concepts/common/user";
import { SessionConcept } from "@/lib/concepts/common/session";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { RoleConcept } from "@/lib/concepts/common/role";
import { OrganizationConcept } from "@/lib/concepts/common/organization";


/**
 * Authentication Synchronizations
 * 
 * Bridges better-auth sessions with our concept-based RBAC system.
 * Handles all auth-related functionality including current user resolution,
 * permission checking, context switching, and logout.
 * 
 * Note: Login/registration is handled by better-auth directly.
 */

export function makeAuthSyncs(
  API: APIConcept,
  User: UserConcept,
  Session: SessionConcept,
  Membership: MembershipConcept,
  Role: RoleConcept,
  Organization: OrganizationConcept,
) {
  console.log('makeAuthSyncs called - registering auth syncs');

  /**
   * Get current authenticated user with RBAC context
   * Triggered by: API.request(GET /api/auth/current-user)
   * The bridge will pre-populate the user data from better-auth in headers
   */
  const GetCurrentUser = ({ request, payload, requestId, status, body }: Vars) => ({
    when: actions([
      API.request,
      { method: "GET", path: "/api/auth/current-user" },
      { request },
    ]),
    where: (frames: Frames) => {
      console.log('GetCurrentUser sync triggered! Frames:', frames.length);
      const result = new Frames();
      for (const frame of frames) {
        // Access the API.request output from the frame via the bound symbol
        const requestData = (frame as any)[request];
        const headers = requestData?.headers ?? {};
        const userIdHeader = headers['x-user-id'];
        const userEmail = headers['x-user-email'] || '';

        // Determine effective role from environment (admin list and auto-register domain)
        const adminUsers = (process.env.ADMIN_USERS || '')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const autoDomain = (process.env.AUTO_REGISTER_DOMAIN || '').toLowerCase();

        let roleName = 'guest';
        if (userEmail && adminUsers.includes(userEmail.toLowerCase())) {
          roleName = 'platform_admin';
        } else if (autoDomain && userEmail.toLowerCase().endsWith(`@${autoDomain}`)) {
          roleName = 'manager';
        }

        const roleDefs: Record<string, { displayName: string; scope: string; permissions: Record<string, any> }> = {
          platform_admin: {
            displayName: 'Platform Admin',
            scope: 'platform',
            permissions: {
              organizations: { create: true, read: true, update: true, delete: true, manage_members: true },
              campaigns: { create: true, read: true, update: true, delete: true, publish: true },
              projects: { create: true, read: true, update: true, delete: true, assign: true },
              teams: { create: true, read: true, update: true, delete: true, manage_members: true },
              profiles: { create: true, read: true, update: true, delete: true, verify: true },
              users: { read: true, update: true },
            },
          },
          manager: {
            displayName: 'Manager',
            scope: 'organization',
            permissions: {
              organizations: { read: true, update: true, manage_members: true },
              campaigns: { create: true, read: true, update: true, publish: true },
              projects: { create: true, read: true, update: true, assign: true },
              teams: { create: true, read: true, update: true, manage_members: true },
              profiles: { read: true, update: true, delete: true, verify: true },
              users: { read: true, update: true, delete: true },
            },
          },
          guest: {
            displayName: 'Guest',
            scope: 'public',
            permissions: {},
          },
        };

        const selectedRole = roleDefs[roleName] || roleDefs.guest;

        const responseBody = userIdHeader
          ? {
              id: userIdHeader,
              email: userEmail,
              name: headers['x-user-name'] || 'User',
              isActive: true,
              currentContext: {},
              effectiveRole: { name: roleName, displayName: selectedRole.displayName, scope: selectedRole.scope, permissions: selectedRole.permissions },
              availableContexts: [],
            }
          : { error: 'Not authenticated' };

        const responseStatus = userIdHeader ? 200 : 401;

        result.push({
          ...(frame as any),
          [payload]: responseBody,
          [requestId]: requestData?.id,
          [status]: responseStatus,
          [body]: responseBody,
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      {
        requestId,
        status,
        body,
      },
    ]),
  });

  /**
   * Switch user context
   */
  const SwitchUserContext = ({ request, requestId, status, body }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/auth/switch-context"
      }, { request }]
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const req = (frame as any)[request];
        const headers = req?.headers || {};
        const ctxId = headers['x-context-id'] || undefined;
        const userId = headers['x-user-id'] || undefined;
        const sessionKey = headers['x-session-key'] || undefined;

        const responseBody = { success: true, contextId: ctxId, userId, sessionKey };

        result.push({
          ...(frame as any),
          [requestId]: req?.id,
          [status]: 200,
          [body]: responseBody,
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      { requestId, status, body },
    ])
  });

  /**
   * Check user permission
   */
  const CheckUserPermission = ({ request, requestId, status, body }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/auth/check-permission"
      }, { request }]
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const req = (frame as any)[request];
        const headers = req?.headers || {};
        const resource = headers['x-resource'] || undefined;
        const action = headers['x-action'] || undefined;

        // For now, return false for permissions (guest role)
        const hasPermission = false;

        result.push({
          ...(frame as any),
          [requestId]: req?.id,
          [status]: 200,
          [body]: { hasPermission, resource, action },
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      { requestId, status, body },
    ])
  });

  /**
   * Get user organizations
   */
  const GetUserOrganizations = ({ request, requestId, status, body }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/auth/organizations" 
      }, { request }]
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const req = (frame as any)[request];
        const organizations: any[] = [];
        result.push({
          ...(frame as any),
          [requestId]: req?.id,
          [status]: 200,
          [body]: { organizations },
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      { requestId, status, body },
    ])
  });

  /**
   * Handle logout
   */
  const LogoutUser = ({ request, requestId, status, body }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/auth/logout"
      }, { request }]
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const req = (frame as any)[request];
        const headers = req?.headers || {};
        const sessionKey = headers['x-session-key'];

        const success = true;

        result.push({
          ...(frame as any),
          [requestId]: req?.id,
          [status]: 200,
          [body]: { success, sessionKey },
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      { requestId, status, body },
    ])
  });

  /**
   * Track session activity (keep sessions alive)
   */
  const TrackSessionActivity = ({ request }: Vars) => ({
    when: actions(
      [API.request as any, {}, { request }]
    ),
    where: (frames: Frames) => {
      const frame = frames[0] as any;
      const headers = frame.request?.headers || {};
      const sessionKey = headers['x-session-key'];
      
      // Only track if we have a valid session
      if (sessionKey) {
        const result = new Frames();
        result.push({
          ...(frame as any),
          sessionKey,
          requestId: frame.request?.id
        } as any);
        return result;
      }
      return new Frames();
    },
    then: actions(
      // For now, just log activity
      // TODO: Add actual session activity tracking
    )
  });

  console.log('makeAuthSyncs returning syncs:', {
    GetCurrentUser: typeof GetCurrentUser,
  });

  return {
    GetCurrentUser,
    SwitchUserContext,
    CheckUserPermission,
    GetUserOrganizations,
    LogoutUser,
    TrackSessionActivity
  };
}


