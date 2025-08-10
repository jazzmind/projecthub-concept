import { actions, Frames } from "@/lib/engine/mod";
import { Vars } from "@/lib/engine/types";
import { APIConcept } from "@/lib/concepts/api";
import { OrganizationConcept } from "@/lib/concepts/organization";

const API = new APIConcept();
const Organization = new OrganizationConcept();

// Handle API requests for organization management
export const HandleOrganizationRequests = ({ request, organizationData }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/organizations", method: "POST" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [organizationData]: $[request].body
      }));
  },
  then: actions(
    [Organization.create, organizationData, {}],
  ),
});

export const HandleOrganizationGetById = ({ request, orgId }: Vars) => ({
  when: actions(
    [API.request, { path: { startsWith: "/api/organizations/" }, method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [orgId]: $[request].path.split('/').pop()
      }))
      .filter(($) => $[orgId]);
  },
  then: actions(
    [Organization._getById, { id: orgId }, {}],
  ),
});

export const HandleOrganizationList = ({ request }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/organizations", method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames;
  },
  then: actions(
    [Organization._getTopLevel, {}, {}],
  ),
});

// Send API responses back
export const SendOrganizationResponse = ({ request, result }: Vars) => ({
  when: actions(
    [Organization.create, {}, { result }],
    [Organization._getById, {}, { result }],
    [Organization._getTopLevel, {}, { result }],
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

export const SendOrganizationError = ({ request, error }: Vars) => ({
  when: actions(
    [Organization.create, {}, { error }],
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