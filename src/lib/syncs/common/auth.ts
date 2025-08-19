import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { UserConcept } from "@/lib/concepts/common/user";
import { SessionConcept } from "@/lib/concepts/common/session";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { RoleConcept } from "@/lib/concepts/common/role";
import { OrganizationConcept } from "@/lib/concepts/common/organization";
import { AuthConcept } from "@/lib/concepts/common/auth";


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
  Auth: AuthConcept,
) {
  console.log('makeAuthSyncs called - registering auth syncs');

  // 1) Phase A: Build current user (invoke async action)
  const BuildCurrentUser = ({ request, userId, userEmail, userName, sessionKey }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "GET", path: "/api/auth/current-user" },
      { request },
    ]),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const req = (frame as any)[request];
        const headers = req?.headers || {};
        result.push({
          ...(frame as any),
          [userId]: headers['x-user-id'],
          [userEmail]: headers['x-user-email'],
          [userName]: headers['x-user-name'] || 'User',
          [sessionKey]: headers['x-session-key'] || '',
        } as any);
      }
      return result;
    },
    then: actions(
      [(Auth as any).buildCurrentUser, { userId, userEmail, userName, sessionKey }],
    ),
  });

  // 2) Phase B: Respond with built user
  const RespondCurrentUser = ({ request, body }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/auth/current-user" }, { request }],
      [(Auth as any).buildCurrentUser, {}, { authUser: body }],
    ),
    then: actions(
      [API.respond as any, { requestId: request, status: 200, body }],
    ),
  });

  /**
   * Switch user context
   */
  // Switch context Phase A
  const SwitchContext = ({ request, userId, sessionKey, contextId }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/auth/switch-context" }, { request }]
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const req = (frame as any)[request];
        const headers = req?.headers || {};
        const body = req?.body || {};
        result.push({
          ...(frame as any),
          [userId]: headers['x-user-id'],
          [sessionKey]: headers['x-session-key'],
          [contextId]: body.contextId || headers['x-context-id'],
        } as any);
      }
      return result;
    },
    then: actions(
      [(Auth as any).switchContext, { userId, sessionKey, contextId }],
    ),
  });

  // Switch context Phase B: respond
  const RespondSwitchContext = ({ request, payload }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/auth/switch-context" }, { request }],
      [(Auth as any).switchContext, {}, { success: payload }],
    ),
    then: actions(
      [API.respond as any, { requestId: request, status: 200, body: payload }],
    ),
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
    where: async (frames: Frames) => {
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
  const GetUserOrganizations = ({ request, userId, body }: Vars) => ({
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
        const headers = req?.headers || {};
        result.push({
          ...(frame as any),
          [userId]: headers['x-user-id'],
        } as any);
      }
      return result;
    },
    then: actions(
      [(Auth as any).listUserOrganizations, { userId }, { organizations: body }],
      [API.respond as any, { requestId: request, status: 200, body }],
    )
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
    where: async (frames: Frames) => {
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
    where: async (frames: Frames) => {
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
    BuildCurrentUser: typeof BuildCurrentUser,
  });

  return {
    BuildCurrentUser,
    RespondCurrentUser,
    SwitchContext,
    RespondSwitchContext,
    CheckUserPermission,
    GetUserOrganizations,
    LogoutUser,
    TrackSessionActivity
  };
}


