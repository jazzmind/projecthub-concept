import { actions, Frames, Vars } from "@sonnenreich/concept-design-engine";
import { APIConcept } from "@/lib/concepts/api";
import { CampaignConcept } from "@/lib/concepts/campaign";

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
  const CreateCampaignResponse = ({ 
    request,
    name, 
    description, 
    educationOrganizationId,
    learningObjectives,
    startDate,
    contactEmail,
    campaign,
    payload
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
    then: actions(
      [API.respond as any, { 
        request,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle campaign get by ID
  const GetCampaign = ({ request, id, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/campaigns/:id",
        id
      }, { request }],
    ),
    where: (frames: Frames) => 
      frames.query(Campaign._getById as any, { id }, { payload }),
    then: actions(
      [API.respond as any, { 
        request,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Handle campaign list
  const ListCampaigns = ({ request, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/campaigns"
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const campaigns = Campaign._getActive();
        result.push({
          ...(frame as any),
          [payload]: campaigns
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
    CreateCampaign,
    CreateCampaignResponse,
    GetCampaign,
    ListCampaigns,
  } as const;
}