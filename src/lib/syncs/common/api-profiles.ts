import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { ProfileConcept } from "@/lib/concepts/common/profile";
import { UserConcept } from "@/lib/concepts/common/user";
import { MembershipConcept } from "@/lib/concepts/common/membership";
import { RoleConcept } from "@/lib/concepts/common/role";
import { SessionConcept } from "@/lib/concepts/common/session";
// import { AssignmentConcept } from "@/lib/concepts/wip_disabled/assignment";

/**
 * Profile Management Synchronizations
 * 
 * Handles user profile creation, management, and expert/partner profile workflows
 */

export function makeApiProfileSyncs(
  API: APIConcept,
  Profile: ProfileConcept,
  User: UserConcept,
  Membership: MembershipConcept,
  Role: RoleConcept,
  Session: SessionConcept,
  // Assignment: AssignmentConcept,
) {

  // Create profile
  const CreateProfile = ({ 
    request,
    userEntity,
    profileType,
    bio,
    title,
    company,
    timezone,
    profileId
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/profiles",
        userEntity,
        profileType,
        bio,
        title,
        company,
        timezone
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const id = `profile_${Date.now()}_${Math.random()}`;
        const currentUser = (frame as any).headers?.['x-user-id'];
        
        // Allow if creating own profile or has permissions
        const canCreate = currentUser === (frame as any)[userEntity] || 
                         (frame as any).userRole === 'platform_admin';
        
        if (canCreate) {
          result.push({
            ...(frame as any),
            [profileId]: id
          } as any);
        }
      }
      return result;
    },
    then: actions(
      [Profile.create as any, { 
        profile: profileId,
        userEntity,
        profileType,
        bio,
        title,
        company,
        timezone
      }],
    ),
  });

  // Create profile success response
  const CreateProfileSuccess = ({ request, profile }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/profiles" }, { request }],
      [Profile.create as any, {}, { profile }],
    ),
    then: actions(
      [API.respond as any, { 
        request,
        status: 201,
        body: { profile }
      }],
    ),
  });

  // Auto-create expert profile on role assignment
  const CreateExpertProfile = ({ 
    userIdentifier, 
    organizationId, 
    membership, 
    expertProfileId 
  }: Vars) => ({
    when: actions(
      [User.register as any, { user: userIdentifier }, { user: "user" }],
      [Membership.accept as any, { 
        memberEntity: userIdentifier,
        targetEntity: organizationId
      }, { membership }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const membershipData = (frame as any)[membership];
        if (membershipData && membershipData.roleEntity === "expert") {
          const profileId = `profile_expert_${String(userIdentifier)}_${Date.now()}`;
          result.push({
            ...(frame as any),
            [expertProfileId]: profileId
          } as any);
        }
      }
      return result;
    },
    then: actions(
      [Profile.create as any, { 
        profile: String(expertProfileId),
        userEntity: String(userIdentifier),
        profileType: "expert",
        bio: "Expert profile",
        timezone: "UTC"
      }],
    ),
  });

  // Auto-create industry partner profile
  const CreateIndustryPartnerProfile = ({ 
    userIdentifier, 
    organizationId, 
    membership, 
    partnerProfileId 
  }: Vars) => ({
    when: actions(
      [User.register as any, { user: userIdentifier }, { user: "user" }],
      [Membership.accept as any, { 
        memberEntity: userIdentifier,
        targetEntity: organizationId
      }, { membership }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        const membershipData = (frame as any)[membership];
        if (membershipData && membershipData.roleEntity === "industry_partner") {
          const profileId = `profile_partner_${String(userIdentifier)}_${Date.now()}`;
          result.push({
            ...(frame as any),
            [partnerProfileId]: profileId
          } as any);
        }
      }
      return result;
    },
    then: actions(
      [Profile.create as any, { 
        profile: String(partnerProfileId),
        userEntity: String(userIdentifier),
        profileType: "industry_partner",
        bio: "Industry partner profile",
        timezone: "UTC"
      }],
    ),
  });

  // Update profile
  const UpdateProfile = ({ 
    request,
    profileId,
    bio,
    title,
    company,
    linkedinUrl,
    website,
    timezone,
    hourlyRate
  }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "PUT", 
        path: "/api/profiles/:profileId",
        profileId,
        bio,
        title,
        company,
        linkedinUrl,
        website,
        timezone,
        hourlyRate
      }, { request }],
    ),
    then: actions(
      [Profile.update as any, { 
        profile: profileId,
        bio,
        title,
        company,
        linkedinUrl,
        website,
        timezone,
        hourlyRate
      }],
    ),
  });

  // Skill linkage moved to Skill concept and Relationship syncs

  // Verify profile
  const VerifyProfile = ({ request, profileId }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/profiles/:profileId/verify",
        profileId
      }, { request }],
    ),
    then: actions(
      [Profile.verify as any, { profile: profileId }],
    ),
  });

  // Completion -> rating moved to workflows; profiles no longer track completions

  // Get profile
  const GetProfile = ({ request, profileId, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/profiles/:profileId",
        profileId
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would get profile data from auth bridge
        const profileData = { id: String(profileId), userEntity: "user_1" };
        result.push({
          ...(frame as any),
          [payload]: [profileData]
        } as any);
      }
      return result;
    },
    then: actions(
      [API.respond as any, { 
        request,
        status: 200,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Search experts by skill
  const SearchExpertsBySkill = ({ request, skillName, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/profiles/experts/search",
        skillName
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would search profiles by skill
        const profiles: any[] = [];
        result.push({
          ...(frame as any),
          [payload]: profiles
        } as any);
      }
      return result;
    },
    then: actions(
      [API.respond as any, { 
        request,
        status: 200,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  // Get verified profiles
  const GetVerifiedProfiles = ({ request, payload }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/profiles/verified"
      }, { request }],
    ),
    where: (frames: Frames) => {
      const result = new Frames();
      for (const frame of frames) {
        // Simplified - would get verified profiles
        const profiles: any[] = [];
        result.push({
          ...(frame as any),
          [payload]: profiles
        } as any);
      }
      return result;
    },
    then: actions(
      [API.respond as any, { 
        request,
        status: 200,
        output: (payload as unknown) as symbol
      }],
    ),
  });

  return {
    CreateProfile,
    CreateProfileSuccess,
    CreateExpertProfile,
    CreateIndustryPartnerProfile,
    UpdateProfile,
    VerifyProfile,
    GetProfile,
    SearchExpertsBySkill,
    GetVerifiedProfiles,
  } as const;
}
