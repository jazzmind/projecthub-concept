import { actions, Frames } from "@/lib/engine/mod";
import { Vars } from "@/lib/engine/types";
import { APIConcept } from "@/lib/concepts/api";
import { TeamConcept } from "@/lib/concepts/team";

const API = new APIConcept();
const Team = new TeamConcept();

// Handle team creation
export const HandleTeamCreate = ({ request, teamData }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/teams", method: "POST" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [teamData]: $[request].body
      }));
  },
  then: actions(
    [Team.create, teamData, {}],
  ),
});

// Handle team get by ID
export const HandleTeamGetById = ({ request, teamId }: Vars) => ({
  when: actions(
    [API.request, { path: { startsWith: "/api/teams/" }, method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [teamId]: $[request].path.split('/').pop()
      }))
      .filter(($) => $[teamId] && $[request].path.split('/').length === 4);
  },
  then: actions(
    [Team._getById, { id: teamId }, {}],
  ),
});

// Handle team list
export const HandleTeamList = ({ request }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/teams", method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames;
  },
  then: actions(
    [Team._getActiveTeams, {}, {}],
  ),
});

// Send team responses
export const SendTeamResponse = ({ request, result }: Vars) => ({
  when: actions(
    [Team.create, {}, { result }],
    [Team._getById, {}, { result }],
    [Team._getActiveTeams, {}, { result }],
  ),
  where: (frames: Frames): Frames => {
    return frames;
  },
  then: actions(
    [API.respond, { 
      requestId: request.id,
      status: 200,
      body: result
    }, {}],
  ),
});

export const SendTeamError = ({ request, error }: Vars) => ({
  when: actions(
    [Team.create, {}, { error }],
  ),
  where: (frames: Frames): Frames => {
    return frames;
  },
  then: actions(
    [API.respond, { 
      requestId: request.id,
      status: 400,
      body: { error }
    }, {}],
  ),
});