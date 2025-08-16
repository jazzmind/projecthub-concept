import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { TeamConcept } from "@/lib/concepts/common/team";
import { UserConcept } from "@/lib/concepts/common/user";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { RoleConcept } from "@/lib/concepts/common/role";
import { SessionConcept } from "@/lib/concepts/common/session";

/**
 * Team Management Synchronizations
 * 
 * Handles team creation, membership management, and team lifecycle operations
 */

export function makeApiTeamSyncs(
  API: APIConcept,
  Team: TeamConcept,
  User: UserConcept,
  Membership: MembershipConcept,
  Role: RoleConcept,
  Session: SessionConcept,
) {

  // Create team
  const CreateTeam = ({ 
    request,
    name,
    description,
    teamId
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams",
        name,
        description
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const id = `team_${Date.now()}_${Math.random()}`;
        const hasPermission = (frame as any).userRole === 'platform_admin' || 
                             (frame as any).userRole === 'org_admin' ||
                             (frame as any).userRole === 'educator' ||
                             (frame as any).userRole === 'learner';
        
        if (hasPermission) {
          result.push({
            ...(frame as any),
            [teamId]: id
          } as any);
        }
      }
      return result;
    },
    then: actions(
      [Team.create as any, { 
        team: teamId,
        name,
        description
      }],
    ),
  });

  // Create team success and auto-assign creator as leader
  const CreateTeamSuccess = ({ 
    request, 
    teamId, 
    team, 
    userId 
  }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/teams" }, { request }],
      [Team.create as any, { team: teamId }, { team }],
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
      [Membership.invite as any, { 
        memberEntity: userId,
        targetEntity: teamId,
        roleEntity: "team_leader",
        invitedBy: userId
      }],
      [API.respond as any, { 
        request,
        status: 201,
        body: { team }
      }],
    ),
  });

  // Auto-accept team leadership
  const CreateTeamAutoAcceptMembership = ({ 
    request, 
    teamId, 
    userId, 
    membership 
  }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/teams" }, { request }],
      [Team.create as any, { team: teamId }, {}],
      [Membership.invite as any, { 
        memberEntity: userId,
        targetEntity: teamId,
        roleEntity: "team_leader",
        invitedBy: userId
      }, { membership }],
    ),
    then: actions(
      [Membership.accept as any, { 
        memberEntity: userId,
        targetEntity: teamId
      }],
    ),
  });

  // Update team
  const UpdateTeam = ({ 
    request,
    teamId,
    name,
    description,
    status
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "PUT", 
        path: "/api/teams/:teamId",
        teamId,
        name,
        description,
        status
      }, { request }],
    ),
    then: actions(
      [Team.update as any, { 
        team: teamId,
        name,
        description,
        status
      }],
    ),
  });

  // Join team
  const JoinTeam = ({ request, teamId, userId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams/:teamId/join",
        teamId
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const currentUser = (frame as any).headers?.['x-user-id'];
        // Simplified - assume team allows joining and user is not already a member
        result.push({
          ...(frame as any),
          [userId]: currentUser
        } as any);
      }
      return result;
    },
    then: actions(
      [Membership.invite as any, { 
        memberEntity: userId,
        targetEntity: teamId,
        roleEntity: "team_member",
        invitedBy: "system"
      }],
    ),
  });

  // Auto-accept team join
  const JoinTeamAutoAccept = ({ 
    request, 
    teamId, 
    userId, 
    membership 
  }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/teams/:teamId/join" }, { request }],
      [Membership.invite as any, { 
        memberEntity: userId,
        targetEntity: teamId,
        roleEntity: "team_member",
        invitedBy: "system"
      }, { membership }],
    ),
    then: actions(
      [Membership.accept as any, { 
        memberEntity: userId,
        targetEntity: teamId
      }],
      [API.respond as any, { 
        request,
        status: 200,
        body: { message: "Successfully joined team" }
      }],
    ),
  });

  // Leave team
  const LeaveTeam = ({ request, teamId, userId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams/:teamId/leave",
        teamId
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const currentUser = (frame as any).headers?.['x-user-id'];
        // Simplified - assume user is a member and can leave
        result.push({
          ...(frame as any),
          [userId]: currentUser
        } as any);
      }
      return result;
    },
    then: actions(
      [Membership.leave as any, { 
        memberEntity: userId,
        targetEntity: teamId
      }],
    ),
  });

  // Get team details
  const GetTeam = ({ request, teamId, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/teams/:teamId",
        teamId
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would get team data from auth bridge
        const teamData = { id: String(teamId), name: "Team", status: "active" };
        result.push({
          ...(frame as any),
          [payload]: [teamData]
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

  // List teams
  const ListTeams = ({ request, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/teams"
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would get active teams
        const teams: any[] = [];
        result.push({
          ...(frame as any),
          [payload]: teams
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

  // Get team members
  const GetTeamMembers = ({ request, teamId, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/teams/:teamId/members",
        teamId
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would get team memberships
        const memberships: any[] = [];
        result.push({
          ...(frame as any),
          [payload]: memberships
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

  // Add team member (by team leader)
  const AddTeamMember = ({ 
    request, 
    teamId, 
    memberEntity, 
    roleEntity, 
    userId 
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams/:teamId/members",
        teamId,
        memberEntity,
        roleEntity
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const currentUser = (frame as any).headers?.['x-user-id'];
        // Simplified - assume user has permission to manage team members
        result.push({
          ...(frame as any),
          [userId]: currentUser
        } as any);
      }
      return result;
    },
    then: actions(
      [Membership.invite as any, { 
        memberEntity,
        targetEntity: teamId,
        roleEntity,
        invitedBy: userId
      }],
    ),
  });

  return {
    CreateTeam,
    CreateTeamSuccess,
    CreateTeamAutoAcceptMembership,
    UpdateTeam,
    JoinTeam,
    JoinTeamAutoAccept,
    LeaveTeam,
    GetTeam,
    ListTeams,
    GetTeamMembers,
    AddTeamMember,
  } as const;
}
