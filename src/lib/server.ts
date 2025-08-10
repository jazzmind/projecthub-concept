import { SyncConcept } from "@/lib/engine/mod";
import { APIConcept } from "@/lib/concepts/api";
import { OrganizationConcept } from "@/lib/concepts/organization";
import { CampaignConcept } from "@/lib/concepts/campaign";
import { TeamConcept } from "@/lib/concepts/team";
import { ExpertConcept } from "@/lib/concepts/expert";
import { IndustryPartnerConcept } from "@/lib/concepts/industryPartner";
import { ProjectConcept } from "@/lib/concepts/project";
import { AssignmentConcept } from "@/lib/concepts/assignment";
import { UserConcept } from "@/lib/concepts/user";

// Initialize sync engine
const Sync = new SyncConcept();

// Register concepts
const concepts = {
  API: new APIConcept(),
  Organization: new OrganizationConcept(),
  Campaign: new CampaignConcept(),
  Team: new TeamConcept(),
  Expert: new ExpertConcept(),
  IndustryPartner: new IndustryPartnerConcept(),
  Project: new ProjectConcept(),
  Assignment: new AssignmentConcept(),
  User: new UserConcept(),
};

// Instrument for reactivity
const { API, Organization, Campaign, Team, Expert, IndustryPartner, Project, Assignment, User } = Sync.instrument(concepts);

// Create synchronizations using instrumented concepts
const createApiCampaignSyncs = () => {
  const { $vars } = require("@/lib/engine/vars");
  const { request, campaignData } = $vars;
  
  return {
    HandleCampaignCreate: ({ request, campaignData }: any) => ({
      when: [
        { action: API.request, input: { path: "/api/campaigns", method: "POST" }, output: { request } }
      ],
      where: (frames: any) => frames.map(($: any) => ({ ...$, [campaignData]: $[request].body })),
      then: [
        { action: Campaign.create, input: campaignData, output: {} }
      ]
    })
  };
};

// For now, let's disable sync registration to test basic functionality
// Sync.register(createApiCampaignSyncs());

// Export for API routes and server actions
export { API, Organization, Campaign, Team, Expert, IndustryPartner, Project, Assignment, User, Sync };
