import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ProfileConcept } from '@/lib/concepts/common/profile';
import { UserConcept } from '@/lib/concepts/common/user';
import { RoleConcept } from '@/lib/concepts/common/role';
import { MembershipConcept } from '@/lib/concepts/common/membership';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock concept instances
const profileConcept = new ProfileConcept();
const userConcept = new UserConcept();
const roleConcept = new RoleConcept();
const membershipConcept = new MembershipConcept();

describe('Profile Workflow Sync Tests', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'profile-sync-' + Date.now();
    
    // Clean up test data
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileSkill.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileSkill.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Profile Creation Workflows', () => {
    test('should create user, role, and profile in sequence', async () => {
      // 1. Create User
      const user = await userConcept.register({
        user: testId + '-user',
        email: `test-${testId}@example.com`,
        name: 'Test Expert'
      });
      expect(user).toHaveProperty('user');

      // 2. Create Expert Role
      const expertRole = await roleConcept.create({
        name: 'expert',
        displayName: 'Expert',
        description: 'Expert role for project guidance',
        scope: 'project',
        permissions: {
          projects: { read: true, feedback: true, mentor: true },
          teams: { read: true, guide: true },
          assignments: { read: true, review: true }
        }
      });
      expect(expertRole).toHaveProperty('role');

      // 3. Create Profile
      const profile = await profileConcept.create({
        profile: testId + '-profile',
        userEntity: testId + '-user',
        profileType: 'expert',
        bio: 'Experienced AI researcher with 10+ years in machine learning and data science',
        title: 'Senior AI Engineer',
        company: 'TechCorp AI Division',
        timezone: 'America/New_York'
      });
      expect(profile).toHaveProperty('profile');

      // 4. Add Skills
      const skill1 = await profileConcept.addSkill({
        profile: testId + '-profile',
        skillName: 'Machine Learning',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 10
      });
      expect(skill1).toHaveProperty('profileSkill');

      const skill2 = await profileConcept.addSkill({
        profile: testId + '-profile',
        skillName: 'Python Programming',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 12
      });
      expect(skill2).toHaveProperty('profileSkill');

      const skill3 = await profileConcept.addSkill({
        profile: testId + '-profile',
        skillName: 'Data Science',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 8
      });
      expect(skill3).toHaveProperty('profileSkill');

      // 5. Add Languages
      const language1 = await profileConcept.addLanguage({
        profile: testId + '-profile',
        language: 'English',
        proficiency: 'native'
      });
      expect(language1).toHaveProperty('profileLanguage');

      const language2 = await profileConcept.addLanguage({
        profile: testId + '-profile',
        language: 'Spanish',
        proficiency: 'conversational'
      });
      expect(language2).toHaveProperty('profileLanguage');

      // 6. Verify Profile
      const verifyResult = await profileConcept.verify({
        profile: testId + '-profile'
      });
      expect(verifyResult).toHaveProperty('profile');

      // 7. Create Membership (assign expert role to organization)
      const membership = await membershipConcept.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org',
        roleEntity: 'expert',
        invitedBy: 'system',
        message: 'Welcome as an expert to our platform!'
      });
      expect(membership).toHaveProperty('membership');

      // Accept membership
      const acceptResult = await membershipConcept.accept({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org'
      });
      expect(acceptResult).toHaveProperty('membership');
    });

    test('should handle industry partner profile creation', async () => {
      // 1. Create User
      const user = await userConcept.register({
        user: testId + '-partner-user',
        email: `partner-${testId}@company.com`,
        name: 'Industry Partner'
      });
      expect(user).toHaveProperty('user');

      // 2. Create Industry Partner Role
      const partnerRole = await roleConcept.create({
        name: 'industry_partner',
        displayName: 'Industry Partner',
        description: 'Industry collaboration role',
        scope: 'project',
        permissions: {
          projects: { read: true, collaborate: true, provide_feedback: true },
          teams: { read: true, observe: true },
          assignments: { read: true }
        }
      });
      expect(partnerRole).toHaveProperty('role');

      // 3. Create Industry Partner Profile
      const profile = await profileConcept.create({
        profile: testId + '-partner-profile',
        userEntity: testId + '-partner-user',
        profileType: 'industry_partner',
        bio: 'Senior executive with 15+ years in healthcare technology, passionate about mentoring next-gen talent',
        title: 'VP of Engineering',
        company: 'HealthTech Solutions Inc.',
        website: 'https://healthtech-solutions.com',
        linkedinUrl: 'https://linkedin.com/in/industry-partner',
        timezone: 'America/Los_Angeles'
      });
      expect(profile).toHaveProperty('profile');

      // 4. Add Industry-Specific Skills
      const businessSkill = await profileConcept.addSkill({
        profile: testId + '-partner-profile',
        skillName: 'Business Strategy',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 15
      });
      expect(businessSkill).toHaveProperty('profileSkill');

      const healthcareSkill = await profileConcept.addSkill({
        profile: testId + '-partner-profile',
        skillName: 'Healthcare Technology',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 12
      });
      expect(healthcareSkill).toHaveProperty('profileSkill');

      const leadershipSkill = await profileConcept.addSkill({
        profile: testId + '-partner-profile',
        skillName: 'Team Leadership',
        skillLevel: 'expert',
        isExpertise: false,
        yearsExperience: 10
      });
      expect(leadershipSkill).toHaveProperty('profileSkill');

      // 5. Verify Profile
      const verifyResult = await profileConcept.verify({
        profile: testId + '-partner-profile'
      });
      expect(verifyResult).toHaveProperty('profile');
    });
  });

  describe('Profile Matching and Discovery', () => {
    beforeEach(async () => {
      // Create multiple expert profiles for testing
      const users = [
        { id: 'ml-expert', name: 'ML Expert', email: 'ml@example.com' },
        { id: 'web-expert', name: 'Web Expert', email: 'web@example.com' },
        { id: 'data-expert', name: 'Data Expert', email: 'data@example.com' }
      ];

      const profiles = [
        {
          id: 'ml-profile',
          user: 'ml-expert',
          type: 'expert',
          bio: 'Machine learning specialist',
          skills: [
            { name: 'Machine Learning', level: 'expert', expertise: true, years: 8 },
            { name: 'Python', level: 'expert', expertise: true, years: 10 },
            { name: 'TensorFlow', level: 'advanced', expertise: true, years: 5 }
          ]
        },
        {
          id: 'web-profile',
          user: 'web-expert',
          type: 'expert',
          bio: 'Full-stack web developer',
          skills: [
            { name: 'React', level: 'expert', expertise: true, years: 6 },
            { name: 'Node.js', level: 'expert', expertise: true, years: 7 },
            { name: 'JavaScript', level: 'expert', expertise: true, years: 10 }
          ]
        },
        {
          id: 'data-profile',
          user: 'data-expert',
          type: 'expert',
          bio: 'Data science and analytics expert',
          skills: [
            { name: 'Data Science', level: 'expert', expertise: true, years: 9 },
            { name: 'Python', level: 'expert', expertise: true, years: 8 },
            { name: 'SQL', level: 'expert', expertise: true, years: 12 }
          ]
        }
      ];

      // Create users
      for (const user of users) {
        await userConcept.register({
          user: testId + '-' + user.id,
          email: `${testId}-${user.email}`,
          name: user.name
        });
      }

      // Create profiles and skills
      for (const profileData of profiles) {
        await profileConcept.create({
          profile: testId + '-' + profileData.id,
          userEntity: testId + '-' + profileData.user,
          profileType: profileData.type,
          bio: profileData.bio,
          timezone: 'UTC'
        });

        await profileConcept.verify({
          profile: testId + '-' + profileData.id
        });

        for (const skill of profileData.skills) {
          await profileConcept.addSkill({
            profile: testId + '-' + profileData.id,
            skillName: skill.name,
            skillLevel: skill.level,
            isExpertise: skill.expertise,
            yearsExperience: skill.years
          });
        }
      }
    });

    test('should find experts by skill', async () => {
      // Find Python experts
      const pythonExperts = await profileConcept._getExpertiseBySkill({
        skillName: 'Python'
      });

      expect(pythonExperts.length).toBeGreaterThanOrEqual(2);
      expect(pythonExperts.every(p => p.profileType === 'expert')).toBe(true);

      // Find React experts
      const reactExperts = await profileConcept._getExpertiseBySkill({
        skillName: 'React'
      });

      expect(reactExperts.length).toBeGreaterThanOrEqual(1);

      // Find Machine Learning experts
      const mlExperts = await profileConcept._getExpertiseBySkill({
        skillName: 'Machine Learning'
      });

      expect(mlExperts.length).toBeGreaterThanOrEqual(1);
    });

    test('should find available experts for project', async () => {
      // Find experts available for a web development project
      const webExperts = await profileConcept._getAvailableForProject({
        skillNames: ['React', 'JavaScript'],
        profileType: 'expert'
      });

      expect(webExperts.length).toBeGreaterThanOrEqual(1);
      expect(webExperts.every(p => p.isVerified && p.isActive)).toBe(true);

      // Find experts available for a data science project
      const dataExperts = await profileConcept._getAvailableForProject({
        skillNames: ['Python', 'Data Science'],
        profileType: 'expert'
      });

      expect(dataExperts.length).toBeGreaterThanOrEqual(2);
      expect(dataExperts.every(p => p.isVerified && p.isActive)).toBe(true);

      // Find experts for multi-skill project
      const fullStackExperts = await profileConcept._getAvailableForProject({
        skillNames: ['Python', 'React', 'Machine Learning'],
        profileType: 'expert'
      });

      expect(fullStackExperts.length).toBeGreaterThanOrEqual(1);
    });

    test('should get top-rated experts', async () => {
      // Record project completions with ratings
      await profileConcept.recordProjectCompletion({
        profile: testId + '-ml-profile',
        rating: 5
      });

      await profileConcept.recordProjectCompletion({
        profile: testId + '-ml-profile',
        rating: 4
      });

      await profileConcept.recordProjectCompletion({
        profile: testId + '-web-profile',
        rating: 3
      });

      await profileConcept.recordProjectCompletion({
        profile: testId + '-data-profile',
        rating: 5
      });

      // Get top-rated experts
      const topRated = await profileConcept._getTopRated({ limit: 5 });

      expect(topRated.length).toBeGreaterThanOrEqual(3);
      
      // Should be ordered by rating (descending)
      for (let i = 0; i < topRated.length - 1; i++) {
        expect(topRated[i].rating).toBeGreaterThanOrEqual(topRated[i + 1].rating);
      }

      // ML expert should have average rating of 4.5 (5+4)/2
      const mlExpert = topRated.find(p => p.profile === testId + '-ml-profile');
      expect(mlExpert?.rating).toBe(4.5);
      expect(mlExpert?.totalProjects).toBe(2);
    });

    test('should filter experts by company', async () => {
      // Update profiles with company information
      await profileConcept.update({
        profile: testId + '-ml-profile',
        company: 'AI Corp'
      });

      await profileConcept.update({
        profile: testId + '-web-profile',
        company: 'Web Solutions Inc'
      });

      await profileConcept.update({
        profile: testId + '-data-profile',
        company: 'AI Corp'
      });

      // Find experts from specific company
      const aiCorpExperts = await profileConcept._getByCompany({
        company: 'AI Corp'
      });

      expect(aiCorpExperts.length).toBe(2);
      expect(aiCorpExperts.every(p => p.company === 'AI Corp')).toBe(true);

      const webSolutionsExperts = await profileConcept._getByCompany({
        company: 'Web Solutions Inc'
      });

      expect(webSolutionsExperts.length).toBe(1);
      expect(webSolutionsExperts[0].company).toBe('Web Solutions Inc');
    });
  });

  describe('Profile Status Management', () => {
    beforeEach(async () => {
      await userConcept.register({
        user: testId + '-status-user',
        email: `status-${testId}@example.com`,
        name: 'Status Test User'
      });

      await profileConcept.create({
        profile: testId + '-status-profile',
        userEntity: testId + '-status-user',
        profileType: 'expert',
        bio: 'Expert for status testing',
        timezone: 'UTC'
      });
    });

    test('should handle profile activation and deactivation', async () => {
      // Verify initial state
      let profiles = await profileConcept._getByProfile({
        profile: testId + '-status-profile'
      });
      expect(profiles[0].isActive).toBe(true);

      // Deactivate profile
      const deactivateResult = await profileConcept.deactivate({
        profile: testId + '-status-profile'
      });
      expect(deactivateResult).toHaveProperty('profile');
      if ('profile' in deactivateResult) {
        expect(deactivateResult.profile.isActive).toBe(false);
      }

      // Reactivate profile
      const activateResult = await profileConcept.activate({
        profile: testId + '-status-profile'
      });
      expect(activateResult).toHaveProperty('profile');
      if ('profile' in activateResult) {
        expect(activateResult.profile.isActive).toBe(true);
      }
    });

    test('should handle profile verification workflow', async () => {
      // Verify initial state
      let profiles = await profileConcept._getByProfile({
        profile: testId + '-status-profile'
      });
      expect(profiles[0].isVerified).toBe(false);

      // Add credentials/skills for verification
      await profileConcept.addSkill({
        profile: testId + '-status-profile',
        skillName: 'Software Engineering',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 5
      });

      await profileConcept.update({
        profile: testId + '-status-profile',
        title: 'Senior Software Engineer',
        company: 'Tech Company',
        linkedinUrl: 'https://linkedin.com/in/expert'
      });

      // Verify profile
      const verifyResult = await profileConcept.verify({
        profile: testId + '-status-profile'
      });
      expect(verifyResult).toHaveProperty('profile');
      if ('profile' in verifyResult) {
        expect(verifyResult.profile.isVerified).toBe(true);
      }

      // Query verified profiles
      const verifiedProfiles = await profileConcept._getVerified();
      expect(verifiedProfiles.length).toBeGreaterThanOrEqual(1);
      expect(verifiedProfiles.some(p => p.profile === testId + '-status-profile')).toBe(true);
    });

    test('should handle skill updates and management', async () => {
      // Add initial skill
      const addResult = await profileConcept.addSkill({
        profile: testId + '-status-profile',
        skillName: 'Initial Skill',
        skillLevel: 'intermediate',
        isExpertise: false,
        yearsExperience: 2
      });
      expect(addResult).toHaveProperty('profileSkill');

      // Update skill
      const updateResult = await profileConcept.updateSkill({
        profile: testId + '-status-profile',
        skillName: 'Initial Skill',
        skillLevel: 'expert',
        isExpertise: true,
        yearsExperience: 5
      });
      expect(updateResult).toHaveProperty('profileSkill');

      // Verify skill was updated
      const skills = await profileConcept._getProfileSkills({
        profile: testId + '-status-profile'
      });
      expect(skills).toHaveLength(1);
      expect(skills[0].skillLevel).toBe('expert');
      expect(skills[0].isExpertise).toBe(true);
      expect(skills[0].yearsExperience).toBe(5);

      // Remove skill
      const removeResult = await profileConcept.removeSkill({
        profile: testId + '-status-profile',
        skillName: 'Initial Skill'
      });
      expect(removeResult).toHaveProperty('success');

      // Verify skill was removed
      const skillsAfterRemoval = await profileConcept._getProfileSkills({
        profile: testId + '-status-profile'
      });
      expect(skillsAfterRemoval).toHaveLength(0);
    });
  });

  describe('Complete Profile Workflows', () => {
    test('should simulate complete expert onboarding workflow', async () => {
      const expertData = {
        user: testId + '-expert-onboard',
        email: `expert-onboard-${testId}@example.com`,
        name: 'New Expert',
        profile: testId + '-expert-onboard-profile',
        bio: 'Newly onboarded expert with extensive industry experience',
        title: 'Principal Engineer',
        company: 'Innovation Labs',
        linkedinUrl: 'https://linkedin.com/in/new-expert',
        website: 'https://new-expert.dev',
        timezone: 'America/Chicago'
      };

      // Step 1: User Registration
      const userResult = await userConcept.register({
        user: expertData.user,
        email: expertData.email,
        name: expertData.name
      });
      expect(userResult).toHaveProperty('user');

      // Step 2: Email Verification
      const verifyEmailResult = await userConcept.verifyEmail({
        user: expertData.user
      });
      expect(verifyEmailResult).toHaveProperty('user');

      // Step 3: Create Expert Profile
      const profileResult = await profileConcept.create({
        profile: expertData.profile,
        userEntity: expertData.user,
        profileType: 'expert',
        bio: expertData.bio,
        title: expertData.title,
        company: expertData.company,
        linkedinUrl: expertData.linkedinUrl,
        website: expertData.website,
        timezone: expertData.timezone
      });
      expect(profileResult).toHaveProperty('profile');

      // Step 4: Add Expertise Skills
      const skills = [
        { name: 'Software Architecture', level: 'expert', expertise: true, years: 12 },
        { name: 'Cloud Computing', level: 'expert', expertise: true, years: 8 },
        { name: 'Microservices', level: 'expert', expertise: true, years: 6 },
        { name: 'DevOps', level: 'advanced', expertise: false, years: 5 },
        { name: 'Team Leadership', level: 'expert', expertise: false, years: 10 }
      ];

      for (const skill of skills) {
        const skillResult = await profileConcept.addSkill({
          profile: expertData.profile,
          skillName: skill.name,
          skillLevel: skill.level,
          isExpertise: skill.expertise,
          yearsExperience: skill.years
        });
        expect(skillResult).toHaveProperty('profileSkill');
      }

      // Step 5: Add Languages
      const languages = [
        { language: 'English', proficiency: 'native' },
        { language: 'Spanish', proficiency: 'fluent' },
        { language: 'French', proficiency: 'conversational' }
      ];

      for (const lang of languages) {
        const langResult = await profileConcept.addLanguage({
          profile: expertData.profile,
          language: lang.language,
          proficiency: lang.proficiency
        });
        expect(langResult).toHaveProperty('profileLanguage');
      }

      // Step 6: Profile Verification
      const profileVerifyResult = await profileConcept.verify({
        profile: expertData.profile
      });
      expect(profileVerifyResult).toHaveProperty('profile');

      // Step 7: Role Assignment
      await roleConcept.create({
        name: 'expert',
        displayName: 'Expert',
        description: 'Expert role',
        scope: 'project',
        permissions: { projects: { mentor: true, feedback: true } }
      });

      const membershipResult = await membershipConcept.invite({
        memberEntity: expertData.user,
        targetEntity: testId + '-platform',
        roleEntity: 'expert',
        invitedBy: 'system'
      });
      expect(membershipResult).toHaveProperty('membership');

      const membershipAccept = await membershipConcept.accept({
        memberEntity: expertData.user,
        targetEntity: testId + '-platform'
      });
      expect(membershipAccept).toHaveProperty('membership');

      // Step 8: Verify Complete Setup
      const finalProfile = await profileConcept._getByProfile({
        profile: expertData.profile
      });
      expect(finalProfile).toHaveLength(1);
      expect(finalProfile[0].isVerified).toBe(true);
      expect(finalProfile[0].isActive).toBe(true);

      const profileSkills = await profileConcept._getProfileSkills({
        profile: expertData.profile
      });
      expect(profileSkills).toHaveLength(5);

      const profileLanguages = await profileConcept._getProfileLanguages({
        profile: expertData.profile
      });
      expect(profileLanguages).toHaveLength(3);

      const activeMembership = await membershipConcept._isActiveMember({
        memberEntity: expertData.user,
        targetEntity: testId + '-platform'
      });
      expect(activeMembership[0]).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle duplicate profile creation', async () => {
      await userConcept.register({
        user: testId + '-duplicate-user',
        email: `duplicate-${testId}@example.com`,
        name: 'Duplicate User'
      });

      // Create first profile
      const firstProfile = await profileConcept.create({
        profile: testId + '-first-profile',
        userEntity: testId + '-duplicate-user',
        profileType: 'expert',
        bio: 'First profile',
        timezone: 'UTC'
      });
      expect(firstProfile).toHaveProperty('profile');

      // Try to create second profile of same type for same user
      const secondProfile = await profileConcept.create({
        profile: testId + '-second-profile',
        userEntity: testId + '-duplicate-user',
        profileType: 'expert',
        bio: 'Second profile',
        timezone: 'UTC'
      });
      expect(secondProfile).toHaveProperty('error');
    });

    test('should handle invalid skill operations', async () => {
      await userConcept.register({
        user: testId + '-skill-user',
        email: `skill-${testId}@example.com`,
        name: 'Skill User'
      });

      await profileConcept.create({
        profile: testId + '-skill-profile',
        userEntity: testId + '-skill-user',
        profileType: 'expert',
        bio: 'Skill testing profile',
        timezone: 'UTC'
      });

      // Try to remove non-existent skill
      const removeResult = await profileConcept.removeSkill({
        profile: testId + '-skill-profile',
        skillName: 'Non-existent Skill'
      });
      expect(removeResult).toHaveProperty('error');

      // Try to update non-existent skill
      const updateResult = await profileConcept.updateSkill({
        profile: testId + '-skill-profile',
        skillName: 'Non-existent Skill',
        skillLevel: 'expert'
      });
      expect(updateResult).toHaveProperty('error');
    });

    test('should handle operations on non-existent profiles', async () => {
      const nonExistentProfile = 'non-existent-profile';

      const updateResult = await profileConcept.update({
        profile: nonExistentProfile,
        bio: 'Should fail'
      });
      expect(updateResult).toHaveProperty('error');

      const verifyResult = await profileConcept.verify({
        profile: nonExistentProfile
      });
      expect(verifyResult).toHaveProperty('error');

      const skillAddResult = await profileConcept.addSkill({
        profile: nonExistentProfile,
        skillName: 'Test Skill',
        skillLevel: 'beginner'
      });
      expect(skillAddResult).toHaveProperty('error');
    });
  });
});
