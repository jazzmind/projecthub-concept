import { actions, Frames, Vars } from "@sonnenreich/concept-design-engine";
import { APIConcept } from "@/lib/concepts/api";
import { ProjectConcept } from "@/lib/concepts/project";

export function makeApiProjectSyncs(
  API: APIConcept,
  Project: ProjectConcept,
) {
  // Handle project creation
  const CreateProject = ({ 
    request,
    title,
    description,
    scope,
    learningObjectives,
    industry,
    domain,
    difficulty,
    estimatedHours,
    requiredSkills,
    deliverables
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/projects",
        title,
        description,
        scope,
        learningObjectives,
        industry,
        domain,
        difficulty,
        estimatedHours,
        requiredSkills,
        deliverables
      }, { request }],
    ),
    then: actions(
      [Project.create as any, { 
        title,
        description,
        scope,
        learningObjectives,
        industry,
        domain,
        difficulty,
        estimatedHours,
        requiredSkills,
        deliverables
      }],
    ),
  });

  // Handle project creation response
  const CreateProjectResponse = ({ 
    request,
    project,
    payload
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/projects"
      }, { request }],
      [Project.create as any, {}, { project }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        result.push({
          ...(frame as any),
          [payload]: { project: (frame as any)[project] }
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

  // Handle project get by ID
  const GetProject = ({ request, id, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/projects/:id",
        id
      }, { request }],
    ),
    where: (frames: Frames) => 
      frames.query(Project._getByProject as any, { project: id }, { payload }),
    then: actions(
      [API.respond as any, { 
        request,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle project list
  const ListProjects = ({ request, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/projects"
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const projects = Project._getByStatus({ status: "published" });
        result.push({
          ...(frame as any),
          [payload]: projects
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

  return {
    CreateProject,
    CreateProjectResponse,
    GetProject,
    ListProjects,
  } as const;
}