import { actions, Frames, Vars } from "@/lib/engine/mod";
import { APIConcept } from "@/lib/concepts/api";
import { TeamConcept } from "@/lib/concepts/team";

export function makeApiTeamSyncs(
  API: APIConcept,
  Team: TeamConcept,
) {
  // Handle team creation
  const CreateTeam = ({ 
    request,
    name,
    description,
    campaignId,
    maxStudents,
    teamType,
    isPublic,
    requiresApproval
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams",
        name,
        description,
        campaignId,
        maxStudents,
        teamType,
        isPublic,
        requiresApproval
      }, { request }],
    ),
    then: actions(
      [Team.create as any, { 
        name,
        description,
        campaignId,
        maxStudents,
        teamType,
        isPublic,
        requiresApproval
      }],
    ),
  });

  // Handle team creation response
  const CreateTeamResponse = ({ 
    request,
    team,
    payload
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams"
      }, { request }],
      [Team.create as any, {}, { team }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        result.push({
          ...(frame as any),
          [payload]: { team: (frame as any)[team] }
        } as any);
      }
      return result;
    },
    then: actions(
      [API.respond as any, { 
        request,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle team get by ID
  const GetTeam = ({ request, id, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/teams/:id",
        id
      }, { request }],
    ),
    where: (frames: Frames) => 
      frames.query(Team._getById as any, { id }, { payload }),
    then: actions(
      [API.respond as any, { 
        request,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle team list
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
        const teams = Team._getActiveTeams();
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
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle adding student to team
  const AddStudentToTeam = ({ 
    request,
    id,
    studentId
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/teams/:id/students",
        id,
        studentId
      }, { request }],
    ),
    then: actions(
      [Team.addStudent as any, { 
        id,
        studentId
      }],
    ),
  });

  return {
    CreateTeam,
    CreateTeamResponse,
    GetTeam,
    ListTeams,
    AddStudentToTeam,
  } as const;
}