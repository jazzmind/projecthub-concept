import { actions, Frames } from "@/lib/engine/mod";
import { Vars } from "@/lib/engine/types";

// Handle campaign creation
export const HandleCampaignCreate = ({ request, campaignData }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/campaigns", method: "POST" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [campaignData]: $[request].body
      }));
  },
  then: actions(
    [Campaign.create, campaignData, {}],
  ),
});

// Handle campaign get by ID
export const HandleCampaignGetById = ({ request, campaignId }: Vars) => ({
  when: actions(
    [API.request, { path: { startsWith: "/api/campaigns/" }, method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames
      .map(($) => ({
        ...$,
        [campaignId]: $[request].path.split('/').pop()
      }))
      .filter(($) => $[campaignId] && $[request].path.split('/').length === 4);
  },
  then: actions(
    [Campaign._getById, { id: campaignId }, {}],
  ),
});

// Handle campaign list
export const HandleCampaignList = ({ request }: Vars) => ({
  when: actions(
    [API.request, { path: "/api/campaigns", method: "GET" }, { request }],
  ),
  where: (frames: Frames): Frames => {
    return frames;
  },
  then: actions(
    [Campaign._getActive, {}, {}],
  ),
});

// Send campaign responses
export const SendCampaignResponse = ({ request, result }: Vars) => ({
  when: actions(
    [Campaign.create, {}, { result }],
    [Campaign._getById, {}, { result }],
    [Campaign._getActive, {}, { result }],
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

export const SendCampaignError = ({ request, error }: Vars) => ({
  when: actions(
    [Campaign.create, {}, { error }],
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
