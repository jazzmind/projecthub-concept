import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { UserConcept } from "@/lib/concepts/common/user";
import { RoleConcept } from "@/lib/concepts/common/role";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { SessionConcept } from "@/lib/concepts/common/session";
import { OrganizationConcept } from "@/lib/concepts/common/organization";
import { CampaignConcept } from "@/lib/concepts/project/campaign";
import { ProjectConcept } from "@/lib/concepts/project/project";
import { TeamConcept } from "@/lib/concepts/common/team";

/**
 * Hierarchical RBAC Synchronizations
 * 
 * Implements the architectural requirement:
 * "A User is Assigned Roles to Organizations, Campaigns, Projects and Teams. 
 * The narrowest role is used for an object. Organization is broadest, 
 * then Campaign, then Project, then Team, then User."
 */

export function makeHierarchicalRBACsyncs(
  API: APIConcept,
  User: UserConcept,
  Role: RoleConcept,
  Membership: MembershipConcept,
  Session: SessionConcept,
  Organization: OrganizationConcept,
  Campaign: CampaignConcept,
  Project: ProjectConcept,
  Team: TeamConcept,
) {
  
  // Initialize platform-level roles when first organization is created
  const InitializePlatformRoles = ({ organization }: Vars) => ({
    when: actions(
      [Organization.create as any, { organizationType: "platform" }, { organization }],
    ),
    then: actions(
      [Role.create as any, { 
        name: "platform_admin", 
        displayName: "Platform Administrator", 
        description: "Full platform access",
        scope: "platform",
        permissions: {
          users: { create: true, read: true, update: true, delete: true, suspend: true },
          organizations: { create: true, read: true, update: true, delete: true, activate: true },
          campaigns: { create: true, read: true, update: true, delete: true, publish: true },
          projects: { create: true, read: true, update: true, delete: true, publish: true, ai_generate: true },
          teams: { create: true, read: true, update: true, delete: true, manage_members: true },
          assignments: { create: true, read: true, update: true, delete: true },
          roles: { create: true, read: true, update: true, delete: true },
          memberships: { create: true, read: true, update: true, suspend: true },
          settings: { create: true, read: true, update: true, delete: true }
        }
      }],
      [Role.create as any, { 
        name: "org_admin", 
        displayName: "Organization Administrator", 
        description: "Organization management",
        scope: "organization",
        permissions: {
          campaigns: { create: true, read: true, update: true, delete: true, publish: true },
          projects: { read: true, update: true, publish: true },
          teams: { create: true, read: true, update: true, manage_members: true },
          assignments: { create: true, read: true, update: true },
          memberships: { create: true, read: true, update: true, suspend: true },
          settings: { create: true, read: true, update: true }
        }
      }],
      [Role.create as any, { 
        name: "educator", 
        displayName: "Educator", 
        description: "Educational content management",
        scope: "campaign",
        permissions: {
          projects: { read: true, update: true },
          teams: { create: true, read: true, update: true, manage_members: true },
          assignments: { create: true, read: true, update: true },
          memberships: { create: true, read: true }
        }
      }],
      [Role.create as any, { 
        name: "expert", 
        displayName: "Expert", 
        description: "Project guidance and feedback",
        scope: "project",
        permissions: {
          projects: { read: true },
          teams: { read: true, read_members: true },
          assignments: { read: true, feedback: true },
          comments: { create: true, read: true }
        }
      }],
      [Role.create as any, { 
        name: "industry_partner", 
        displayName: "Industry Partner", 
        description: "Industry collaboration",
        scope: "project",
        permissions: {
          projects: { read: true, update: true },
          teams: { read: true, read_members: true },
          assignments: { read: true },
          comments: { create: true, read: true }
        }
      }],
      [Role.create as any, { 
        name: "team_leader", 
        displayName: "Team Leader", 
        description: "Team leadership",
        scope: "team",
        permissions: {
          teams: { read: true, update: true, manage_members: true },
          assignments: { read: true, update: true, accept: true },
          projects: { read: true },
          comments: { create: true, read: true, update: true }
        }
      }],
      [Role.create as any, { 
        name: "learner", 
        displayName: "Learner", 
        description: "Learning participation",
        scope: "team",
        permissions: {
          teams: { read: true },
          assignments: { read: true },
          projects: { read: true },
          comments: { create: true, read: true }
        }
      }],
    ),
  });

  // Helper function to determine effective role for a user in a context
  const GetEffectiveRole = ({ userId, contextEntity, effectiveRole }: Vars) => ({
    when: actions(
      [API.request as any, { userId, contextEntity }, {}],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        // For now, use simplified role resolution
        // In a proper implementation, this would be done via the auth bridge
        // which would pre-populate the user's effective role based on context
        const contextId = (frame as any)[contextEntity];
        let role = 'guest'; // Default fallback
        
        // Extract role from frame data that should be pre-populated by auth bridge
        if ((frame as any).effectiveUserRole) {
          role = (frame as any).effectiveUserRole;
        }
        
        if (role) {
          result.push({
            ...(frame as any),
            [effectiveRole]: role
          } as any);
        }
      }
      return result;
    },
    then: actions(),
  });

  // Permission check synchronization
  const CheckPermission = ({ userId, contextEntity, resource, action, hasPermission }: Vars) => ({
    when: actions(
      [API.request as any, { userId, contextEntity, resource, action }, {}],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        // Use simplified permission check based on pre-populated role data
        const contextId = (frame as any)[contextEntity];
        const userRole = (frame as any).effectiveUserRole || 'guest';
        const resourceName = (frame as any)[resource];
        const actionName = (frame as any)[action];
        
        // Simplified permission check - for now assume basic permissions
        let permitted = false;
        
        // Basic role-based permissions (this should be expanded with proper RBAC logic)
        if (userRole === 'platform_admin') {
          permitted = true; // Platform admins have all permissions
        } else if (userRole === 'org_admin') {
          permitted = ['organizations', 'campaigns', 'projects', 'teams'].includes(resourceName);
        } else if (userRole === 'educator') {
          permitted = ['projects', 'teams', 'assignments'].includes(resourceName);
        } else if (userRole === 'expert' || userRole === 'industry_partner') {
          permitted = resourceName === 'projects' && ['read', 'comment'].includes(actionName);
        }
        
        result.push({
          ...(frame as any),
          [hasPermission]: permitted
        } as any);
      }
      return result;
    },
    then: actions(),
  });

  // Campaign-Organization membership sync (architectural requirement)
  const CreateCampaignMembership = ({ campaign, organization, membership }: Vars) => ({
    when: actions(
      [Campaign.create as any, { campaign }, { campaign }],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        // Determine parent organization from context
        const campaignData = (frame as any)[campaign];
        // This would need to be derived from session context or campaign data
        const parentOrg = "org_default"; // Simplified
        
        result.push({
          ...(frame as any),
          [organization]: parentOrg,
          [membership]: `membership_${campaignData.campaign}_${parentOrg}`
        } as any);
      }
      return result;
    },
    then: actions(
      [Membership.invite as any, { 
        memberEntity: campaign, 
        targetEntity: organization, 
        roleEntity: "campaign_member",
        invitedBy: "system"
      }],
      [Membership.accept as any, { memberEntity: campaign, targetEntity: organization }],
    ),
  });

  // Project-Campaign membership sync (architectural requirement)
  const CreateProjectMembership = ({ project, campaigns, membership }: Vars) => ({
    when: actions(
      [Project.create as any, { project }, { project }],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        // Projects can belong to multiple campaigns
        const activeCampaigns = Campaign._getActive();
        
        result.push({
          ...(frame as any),
          [campaigns]: activeCampaigns,
          [membership]: `membership_${(frame as any)[project]}_campaigns`
        } as any);
      }
      return result;
    },
    then: actions(
      // This would need to iterate over campaigns - simplified here
      [Membership.invite as any, { 
        memberEntity: project, 
        targetEntity: "campaign_default", 
        roleEntity: "project_member",
        invitedBy: "system"
      }],
    ),
  });

  // User-Team membership sync (architectural requirement)
  const CreateUserTeamMembership = ({ user, teams }: Vars) => ({
    when: actions(
      [User.register as any, { user }, { user }],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        // Users can belong to multiple teams
        const availableTeams = Team._getByStatus({ status: "forming" });
        
        result.push({
          ...(frame as any),
          [teams]: availableTeams
        } as any);
      }
      return result;
    },
    then: actions(),
  });

  // Context-aware permission enforcement
  const EnforcePermissions = ({ request, userId, contextEntity, resource, action }: Vars) => ({
    when: actions(
      [API.request as any, { userId, resource, action }, { request }],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        const requestData = (frame as any)[request];
        const context = requestData.contextId || 'default'; // Use context from request data
        
        // Simplified permission check for now
        const userRole = (frame as any).effectiveUserRole || 'guest';
        const hasPermission = userRole === 'platform_admin'; // Simplified - all platform admins get access
        
        if (hasPermission) {
          result.push({
            ...(frame as any),
            [contextEntity]: context
          } as any);
        }
      }
      return result;
    },
    then: actions(),
  });

  // Auto-assign creator roles
  const AssignCreatorRole = ({ userId, entityId, entityType, role }: Vars) => ({
    when: actions(
      [Organization.create as any, {}, { organization: entityId }],
      [Campaign.create as any, {}, { campaign: entityId }],
      [Project.create as any, {}, { project: entityId }],
      [Team.create as any, {}, { team: entityId }],
    ),
    where: (frames: Frames): Frames => {
      const result = new Frames();
      for (const frame of frames) {
        // Determine appropriate creator role based on entity type
        let creatorRole = "owner";
        if (entityId in frame && (frame as any)[entityId]) {
          const entity = (frame as any)[entityId];
          if (entity.organization) creatorRole = "org_admin";
          else if (entity.campaign) creatorRole = "educator";
          else if (entity.project) creatorRole = "industry_partner";
          else if (entity.team) creatorRole = "team_leader";
        }
        
        result.push({
          ...(frame as any),
          [role]: creatorRole
        } as any);
      }
      return result;
    },
    then: actions(
      [Membership.invite as any, { 
        memberEntity: userId, 
        targetEntity: entityId, 
        roleEntity: role,
        invitedBy: "system"
      }],
      [Membership.accept as any, { memberEntity: userId, targetEntity: entityId }],
    ),
  });

  return {
    InitializePlatformRoles,
    GetEffectiveRole,
    CheckPermission,
    CreateCampaignMembership,
    CreateProjectMembership,
    CreateUserTeamMembership,
    EnforcePermissions,
    AssignCreatorRole,
  } as const;
}
