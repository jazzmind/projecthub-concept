import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { OrganizationConcept } from "@/lib/concepts/common/organization";
import { UserConcept } from "@/lib/concepts/common/user";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { RoleConcept } from "@/lib/concepts/common/role";
import { SessionConcept } from "@/lib/concepts/common/session";

/**
 * Organization Management Synchronizations
 * 
 * Handles organization creation, management, and membership workflows
 */

export function makeApiOrganizationSyncs(
  API: APIConcept,
  Organization: OrganizationConcept,
  User: UserConcept,
  Membership: MembershipConcept,
  Role: RoleConcept,
  Session: SessionConcept,
) {

  // Create organization with permission check
  const CreateOrganization = ({ 
    request,
    name,
    description,
    domain,
    organizationType,
    contactEmail,
    website,
    parentOrganization,
    organizationId
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/organizations",
        name,
        description,
        domain,
        organizationType,
        contactEmail,
        website,
        parentOrganization
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        
        // Simplified permission check - in production would validate via auth bridge
        const hasPermission = true; // Allow organization creation for now
        
        if (hasPermission) {
          result.push({
            ...(frame as any),
          } as any);
        }
      }
      return result;
    },
    then: actions(
      [Organization.create as any, { 
        name,
        description,
        domain,
        organizationType,
        contactEmail,
        website,
        parentOrganization
      }],
    ),
  });

  // Handle organization creation success and auto-assign creator as admin
  const CreateOrganizationSuccess = ({ 
    request, 
    organizationId, 
    organization, 
    userId 
  }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/organizations" }, { request }],
      [Organization.create as any, { organization: organizationId }, { organization }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const currentUser = (frame as any).headers?.['x-user-id'];
        result.push({
          ...(frame as any),
          [userId]: currentUser
        } as any);
      }
      return result;
    },
    then: actions(
      [Role.create as any, { 
        name: "org_admin",
        displayName: "Organization Administrator",
        description: "Full administrative access to organization",
        scope: "context",
        permissions: "organizationAdminPermissions"
      }],
      [Membership.invite as any, { 
        memberEntity: userId,
        targetEntity: organizationId,
        roleEntity: "org_admin",
        invitedBy: "system"
      }],
      [API.respond as any, { request, status: 201, body: { organization } }],
    ),
  });

  // Auto-accept admin membership
  const CreateOrganizationAutoAcceptAdmin = ({ 
    request, 
    organizationId, 
    userId, 
    membership 
  }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/organizations" }, { request }],
      [Organization.create as any, { organization: organizationId }, {}],
      [Membership.invite as any, { 
        memberEntity: userId,
        targetEntity: organizationId,
        roleEntity: "org_admin",
        invitedBy: "system"
      }, { membership }],
    ),
    then: actions(
      [Membership.accept as any, { 
        memberEntity: userId,
        targetEntity: organizationId
      }],
    ),
  });

  // Update organization
  const UpdateOrganization = ({ 
    request,
    organizationId,
    name,
    description,
    contactEmail,
    website,
    settings
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "PUT", 
        path: "/api/organizations/:organizationId",
        organizationId,
        name,
        description,
        contactEmail,
        website,
        settings
      }, { request }],
    ),
    then: actions(
      [Organization.update as any, { 
        organization: organizationId,
        name,
        description,
        contactEmail,
        website,
        settings
      }],
    ),
  });

  // Get organization details (trigger)
  const GetOrganization = ({ request, organizationId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/organizations/:organizationId",
        organizationId
      }, { request }],
    ),
    then: actions([
      Organization.getById, { id: organizationId }  // Use action form, not query form
    ]),
  });

  // Get organization details (response)
  const GetOrganizationResponse = ({ request, requestId, organizationId, organizationData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/organizations/:organizationId" }, { request }],
      [Organization.getById, { id: organizationId }, { organization: organizationData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const organization = (frame as any)[organizationData];
        const bodyData = { organization };
        
        return {
          ...frame,
          [requestId]: (frame as any)[request]?.id,
          [responseBody]: bodyData,
        };
      });
    },
    then: actions([
      API.respond,
      { requestId, status: 200, body: responseBody },
    ]),
  });

  // Trigger organization fetch (like CreateQuiz pattern in sync-quizzie)
  const ListOrganizations = ({ request }: Vars) => ({
    when: actions([
      API.request,
      { method: "GET", path: "/api/organizations" },
      { request },
    ]),
    then: actions([
      Organization.listTopLevel,
      {},
    ]),
  });

  // Respond with organizations when available (like CreateQuizResponse pattern)
  const ListOrganizationsResponse = ({ request, requestId, organizationsData, responseBody }: Vars) => ({
    when: actions(
      [API.request, { method: "GET", path: "/api/organizations" }, { request }],
      [Organization.listTopLevel, {}, { organizations: organizationsData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const orgData = (frame as any)[organizationsData];
        
        // Build the response body in the where clause to avoid nested symbol resolution
        const bodyData = { organizations: orgData };
        
        return {
          ...frame,
          [requestId]: (frame as any)[request]?.id,
          [responseBody]: bodyData,
        };
      });
    },
    then: actions([
      API.respond,
      { requestId, status: 200, body: responseBody },
    ]),
  });

  // Get organization members (trigger)
  const GetOrganizationMembers = ({ request, organizationId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/organizations/:organizationId/members",
        organizationId
      }, { request }],
    ),
    then: actions([
      Membership.listByTarget, { targetEntity: organizationId }  // Use query form for data fetching
    ]),
  });

  // Get organization members (response)
  const GetOrganizationMembersResponse = ({ request, requestId, organizationId, membersData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/organizations/:organizationId/members" }, { request }],
      [Membership.listByTarget, { targetEntity: organizationId }, { members: membersData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const memberships = (frame as any)[membersData];  // This is the memberships array
        const bodyData = { members: memberships };  // Rename to "members" for API consistency
        return {
          ...frame, 
          [requestId]: (frame as any)[request]?.id,
          [responseBody]: bodyData,
        };
      });
    },
    then: actions([
      API.respond,
      { requestId, status: 200, body: responseBody },
    ]),
  });

  // Activate organization
  const ActivateOrganization = ({ request, organizationId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/organizations/:organizationId/activate",
        organizationId
      }, { request }],
    ),
    then: actions(
      [Organization.update as any, { id: String(organizationId), isActive: true }],
    ),
  });

  // Deactivate organization
  const DeactivateOrganization = ({ request, organizationId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/organizations/:organizationId/deactivate",
        organizationId
      }, { request }],
    ),
    then: actions(
      [Organization.update as any, { id: String(organizationId), isActive: false }],
    ),
  });

  // Search organizations
  const SearchOrganizations = ({ request, name, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/organizations/search",
        name
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would search organizations
        const organizations: any[] = [];
        result.push({
          ...(frame as any),
          [payload]: organizations
        } as any);
      }
      return result;
    },
    then: actions(
      [API.respond as any, { 
        request,
        status: 200,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  return {
    CreateOrganization,
    CreateOrganizationSuccess,
    CreateOrganizationAutoAcceptAdmin,
    UpdateOrganization,
    GetOrganization,
    GetOrganizationResponse,
    ListOrganizations,
    ListOrganizationsResponse,
    GetOrganizationMembers,
    GetOrganizationMembersResponse,
    ActivateOrganization,
    DeactivateOrganization,
    SearchOrganizations,
  } as const;
}