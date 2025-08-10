import { actions, Frames } from "@/lib/engine/mod";
import { Vars } from "@/lib/engine/types";
import { APIConcept } from "@/lib/concepts/api";
import { ProjectConcept } from "@/lib/concepts/project";

const API = new APIConcept();
const Project = new ProjectConcept();

// Handle project creation
export const HandleProjectCreate = ({ request, projectData }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/projects", method: "POST" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [projectData]: $[request].body
      }));
  },
  then: actions(
    [Project.create, projectData, {}],
  ),
});

// Handle AI project generation
export const HandleProjectGenerate = ({ request, projectData }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/projects/generate", method: "POST" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [projectData]: $[request].body
      }));
  },
  then: actions(
    [Project.generateWithAI, projectData, {}],
  ),
});

// Handle project get by ID
export const HandleProjectGetById = ({ request, projectId }: Vars) => ({
  when: actions(
    [API.request, { path: { startsWith: "/api/projects/" }, method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [projectId]: $[request].path.split('/').pop()
      }))
      .filter(($) => $[projectId] && $[request].path.split('/').length === 4);
  },
  then: actions(
    [Project._getById, { id: projectId }, {}],
  ),
});

// Handle project list
export const HandleProjectList = ({ request }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/projects", method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames;
  },
  then: actions(
    [Project._getByStatus, { status: "active" }, {}],
  ),
});

// Send project responses
export const SendProjectResponse = ({ request, result }: Vars) => ({
  when: actions(
    [Project.create, {}, { result }],
    [Project.generateWithAI, {}, { result }],
    [Project._getById, {}, { result }],
    [Project._getByStatus, {}, { result }],
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

export const SendProjectError = ({ request, error }: Vars) => ({
  when: actions(
    [Project.create, {}, { error }],
    [Project.generateWithAI, {}, { error }],
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
