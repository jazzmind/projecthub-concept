import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { CampaignConcept } from "@/lib/concepts/project/campaign";

export function makeApiCampaignSyncs(
  API: APIConcept,
  Campaign: CampaignConcept,
) {
  // Handle campaign creation
  const CreateCampaign = ({ 
    request, 
    name, 
    description, 
    educationOrganizationId,
    learningObjectives,
    startDate,
    contactEmail 
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/campaigns",
        name,
        description,
        educationOrganizationId,
        learningObjectives,
        startDate,
        contactEmail
      }, { request }],
    ),
    then: actions(
      [Campaign.create as any, { 
        name,
        description,
        educationOrganizationId,
        learningObjectives,
        startDate,
        contactEmail
      }],
    ),
  });

  // Handle campaign creation response
  const CreateCampaignResponse = ({ request, requestId, status, body, name, description, educationOrganizationId, learningObjectives, startDate, contactEmail, campaign, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/campaigns",
        name,
        description,
        educationOrganizationId,
        learningObjectives,
        startDate,
        contactEmail
      }, { request }],
      [Campaign.create as any, { 
        name,
        description,
        educationOrganizationId,
        learningObjectives,
        startDate,
        contactEmail
      }, { campaign }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        result.push({
          ...(frame as any),
          [payload]: { campaign: (frame as any)[campaign] }
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      { requestId, status: 201, body: payload },
    ]),
  });

  // Handle campaign get by ID
  const GetCampaign = ({ request, requestId, status, body, id, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/campaigns/:id",
        id
      }, { request }],
    ),
    where: (frames: Frames) => 
      frames.query(Campaign._getById as any, { id }, { payload }),
    then: actions([
      API.respond as any,
      { requestId, status: 200, body: payload },
    ]),
  });

  // Handle campaign list (two-step to support async action)
  const ListCampaignsRequest = ({ request }: Vars) => ({
    when: actions(
      [API.request as any, {
        method: "GET",
        path: "/api/campaigns",
      }, { request }],
    ),
    then: actions(
      [Campaign._getActive as any, {}],
    ),
  });

  const ListCampaignsResponse = ({ request, requestId, status, body, campaigns, payload }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/campaigns" }, { request }],
      [Campaign._getActive as any, {}, { campaigns }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const list = (frame as any)[campaigns];
        const req = (frame as any)[request];
        result.push({
          ...(frame as any),
          [payload]: list,
          [requestId]: req?.id,
          [status]: 200,
          [body]: list,
        } as any);
      }
      return result;
    },
    then: actions([
      API.respond as any,
      { requestId, status, body },
    ]),
  });

  return {
    CreateCampaign,
    CreateCampaignResponse,
    GetCampaign,
    ListCampaignsRequest,
    ListCampaignsResponse,
  } as const;
}