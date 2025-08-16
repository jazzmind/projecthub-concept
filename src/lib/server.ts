import { SyncConcept, actions } from "@/lib/engine";
import { Logging } from "@/lib/engine/sync";
import { APIConcept } from "@/lib/concepts/common/api";
import { OrganizationConcept } from "@/lib/concepts/common/organization";
import { CampaignConcept } from "@/lib/concepts/project/campaign";
import { TeamConcept } from "@/lib/concepts/common/team";
import { ProfileConcept } from "@/lib/concepts/common/profile";
import { ProjectConcept } from "@/lib/concepts/project/project";
//import { AssignmentConcept } from "@/lib/concepts/wip/assignment";
import { UserConcept } from "@/lib/concepts/common/user";
import { RoleConcept } from "@/lib/concepts/common/role";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { SessionConcept } from "@/lib/concepts/common/session";
//import { SkillConcept } from "@/lib/concepts/wip/skill";
import { RelationshipConcept } from "@/lib/concepts/common/relationship";
// import { NotificationConcept } from "@/lib/concepts/notification";
// import { FileConcept } from "@/lib/concepts/file";
// import { CommentConcept } from "@/lib/concepts/comment";
// import { SettingConcept } from "@/lib/concepts/setting";
// import { TagConcept } from "@/lib/concepts/tag";

// Import sync functions
import { 
  makeApiUserSyncs,
  makeApiOrganizationSyncs,
  makeApiTeamSyncs,
  makeApiCampaignSyncs,
  makeApiProjectSyncs,
  //makeApiSkillSyncs,
  makeApiRelationshipSyncs,
  makeHierarchicalRBACsyncs,
  makeAuthSyncs,
  makeProjectExtractionSyncs
  // Temporarily excluding these syncs due to concept dependencies:
  // makeNotificationWorkflowSyncs,
  // makeContentManagementSyncs
} from "@/lib/syncs";

/**
 * Concept Engine Bootstrap (Server)
 *
 * Purpose
 *   - Instantiate the Sync engine, register independent concepts, instrument
 *     their actions for reactivity, and register synchronizations that compose
 *     behaviors across concepts.
 *
 * Architecture
 *   - Concepts are independent (no cross-imports). All coordination happens via
 *     synchronizations registered with the engine. See docs/concept-design.md
 *     and docs/synchronization-implementation.md.
 *
 * Sync vs Async
 *   - Engine orchestration (register/instrument) is synchronous at bootstrap.
 *   - Individual concept actions can be async (DB/network), and the engine will
 *     await them during synchronization execution.
 *
 * Logging
 *   - TRACE prints a concise line for each action with inputs/outputs.
 *   - VERBOSE prints frame matching and sync provenance details. Use VERBOSE
 *     during deep debugging; keep TRACE by default in dev to understand flows.
 */

// Initialize sync engine with debugging
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE; // Detailed action tracing (see docs/debugging.md)

// Register concepts
const concepts = {
  API: new APIConcept(),
  Organization: new OrganizationConcept(),
  Campaign: new CampaignConcept(),
  Team: new TeamConcept(),
  Profile: new ProfileConcept(),
  Project: new ProjectConcept(),
  //Assignment: new AssignmentConcept(),
  User: new UserConcept(),
  Role: new RoleConcept(),
  Membership: new MembershipConcept(),
  Session: new SessionConcept(),
  //Skill: new SkillConcept(),
  Relationship: new RelationshipConcept(),
  // Notification: new NotificationConcept(),
  // File: new FileConcept(),
  // Comment: new CommentConcept(),
  // Setting: new SettingConcept(),
  // Tag: new TagConcept(),
};

// Instrument for reactivity
// Instrumentation wraps action methods so the engine can observe invocations,
// assign flow tokens, and trigger synchronizations automatically.
const { API, Organization, Campaign, Team, Profile, Project, User, Role, Membership, Session, Relationship } = Sync.instrument(concepts);

// Register synchronizations
// Each `make*Syncs` returns a map of sync functions that connect concept actions
// into end-to-end workflows (e.g., API.request -> domain action -> API.response).
const authSyncs = makeAuthSyncs(API, User, Session, Membership, Role, Organization);
const orgSyncs = makeApiOrganizationSyncs(API, Organization, User, Membership, Role, Session);
const teamSyncs = makeApiTeamSyncs(API, Team, User, Membership, Role, Session);
const campaignSyncs = makeApiCampaignSyncs(API, Campaign);
const projectSyncs = makeApiProjectSyncs(API, Project, User, Membership, Role, Session);
//const skillSyncs = makeApiSkillSyncs(API, Skill);
const relationshipSyncs = makeApiRelationshipSyncs(API, Relationship);
const rbacSyncs = makeHierarchicalRBACsyncs(API, User, Role, Membership, Session, Organization, Campaign, Project, Team);
const userSyncs = makeApiUserSyncs(API, User);
const projectExtractionSyncs = makeProjectExtractionSyncs(API, Project, Membership);
// Register all syncs with the engine  
Sync.register({
  ...authSyncs,
  // Temporarily disable other syncs to focus on project extraction
  // ...userSyncs,
  // ...orgSyncs,
  // ...teamSyncs,
  // ...campaignSyncs,
  ...projectSyncs,
  ...projectExtractionSyncs,
  // ...relationshipSyncs,
  // ...rbacSyncs,
});

// Export for API routes and server actions
export { API, Organization, Campaign, Team, Profile, Project, User, Role, Membership, Session, Relationship, Sync };