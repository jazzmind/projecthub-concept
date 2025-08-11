import { SyncConcept } from "@sonnenreich/concept-design-engine";
import { APIConcept } from "@/lib/concepts/api";
import { OrganizationConcept } from "@/lib/concepts/organization";
import { CampaignConcept } from "@/lib/concepts/campaign";
import { TeamConcept } from "@/lib/concepts/team";
import { ExpertConcept } from "@/lib/concepts/expert";
import { ProjectConcept } from "@/lib/concepts/project";
import { AssignmentConcept } from "@/lib/concepts/assignment";
import { UserConcept } from "@/lib/concepts/user";
import { RoleConcept } from "@/lib/concepts/role";
import { MembershipConcept } from "@/lib/concepts/membership";
import { SessionConcept } from "@/lib/concepts/session";

// Import sync functions
// TODO: Update sync files to work with generic concepts
/*
import { 
  makeApiOrganizationSyncs,
  makeApiTeamSyncs,
  makeApiCampaignSyncs,
  makeApiProjectSyncs
} from "@/lib/syncs";
*/

// Initialize sync engine
const Sync = new SyncConcept();

// Register concepts
const concepts = {
  API: new APIConcept(),
  Organization: new OrganizationConcept(),
  Campaign: new CampaignConcept(),
  Team: new TeamConcept(),
  Expert: new ExpertConcept(),
  Project: new ProjectConcept(),
  Assignment: new AssignmentConcept(),
  User: new UserConcept(),
  Role: new RoleConcept(),
  Membership: new MembershipConcept(),
  Session: new SessionConcept(),
};

// Instrument for reactivity
const { API, Organization, Campaign, Team, Expert, Project, Assignment, User, Role, Membership, Session } = Sync.instrument(concepts);

// Register synchronizations
// TODO: Complete sync engine integration with proper pattern
// The sync files are ready but need the engine to be properly configured
// For now, we'll use direct API routes while keeping the sync architecture intact
/*
const organizationSyncs = makeApiOrganizationSyncs(API, Organization);
const campaignSyncs = makeApiCampaignSyncs(API, Campaign);
const projectSyncs = makeApiProjectSyncs(API, Project);
const teamSyncs = makeApiTeamSyncs(API, Team);

// Register all syncs with the engine
Sync.register({
  ...organizationSyncs,
  ...campaignSyncs,
  ...projectSyncs,
  ...teamSyncs,
});
*/

// Export for API routes and server actions
export { API, Organization, Campaign, Team, Expert, Project, Assignment, User, Role, Membership, Session, Sync };