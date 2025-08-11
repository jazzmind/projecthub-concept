import { actions, Frames, Vars } from "@/lib/engine/mod";
import { APIConcept } from "@/lib/concepts/api";
import { OrganizationConcept } from "@/lib/concepts/organization";

export function makeApiOrganizationSyncs(
  API: APIConcept,
  Organization: OrganizationConcept,
) {
  // Handle organization creation
  const CreateOrganization = ({ 
    request,
    name,
    description,
    domain,
    type,
    website
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/organizations",
        name,
        description,
        domain,
        type,
        website
      }, { request }],
    ),
    then: actions(
      [Organization.create as any, { 
        name,
        description,
        domain,
        type,
        website
      }],
    ),
  });

  // Handle organization creation response
  const CreateOrganizationResponse = ({ 
    request,
    name,
    description,
    domain,
    type,
    website,
    organization,
    payload
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/organizations",
        name,
        description,
        domain,
        type,
        website
      }, { request }],
      [Organization.create as any, { 
        name,
        description,
        domain,
        type,
        website
      }, { organization }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        result.push({
          ...(frame as any),
          [payload]: { organization: (frame as any)[organization] }
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

  // Handle organization get by ID
  const GetOrganization = ({ request, id, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/organizations/:id",
        id
      }, { request }],
    ),
    where: (frames: Frames) => 
      frames.query(Organization._getById as any, { id }, { payload }),
    then: actions(
      [API.respond as any, { 
        request,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle organization list
  const ListOrganizations = ({ request, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/organizations"
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const organizations = Organization._getTopLevel();
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
        output: (payload as unknown) as symbol
      }],
    ),
  });

  return {
    CreateOrganization,
    CreateOrganizationResponse,
    GetOrganization,
    ListOrganizations,
  } as const;
}