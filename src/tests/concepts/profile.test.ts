import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ProfileConcept } from '@/lib/concepts/common/profile';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const profileConcept = new ProfileConcept();

describe('ProfileConcept', () => {
  let testUserId: string;
  let testProfileId: string;

  beforeEach(async () => {
    // Clean up test data
    // Languages and ProfileSkill removed; clean only profiles
    await prisma.profile.deleteMany({});
    
    // Create test data
    testUserId = 'test-user-' + Date.now();
    testProfileId = 'test-profile-' + Date.now();
  });

  afterEach(async () => {
    // Clean up after each test
    // Languages and ProfileSkill removed; clean only profiles
    await prisma.profile.deleteMany({});
  });

  describe('create', () => {
    test('should create a new profile successfully', async () => {
      const profileData = {
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Experienced AI researcher with focus on machine learning',
        title: 'Senior AI Engineer',
        company: 'Tech Corp',
        timezone: 'America/New_York'
      };

      const result = await profileConcept.create(profileData);

      expect(result).toHaveProperty('profile');
      if ('profile' in result) {
        expect(result.profile.profile).toBe(testProfileId);
        expect(result.profile.userEntity).toBe(testUserId);
        expect(result.profile.profileType).toBe('expert');
        expect(result.profile.bio).toBe(profileData.bio);
        expect(result.profile.title).toBe(profileData.title);
        expect(result.profile.company).toBe(profileData.company);
        expect(result.profile.timezone).toBe(profileData.timezone);
        expect(result.profile.rating).toBe(0);
        expect(result.profile.isActive).toBe(true);
        expect(result.profile.isVerified).toBe(false);
      }
    });

    test('should prevent duplicate profiles for same user and type', async () => {
      const profileData = {
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'First profile',
        timezone: 'UTC'
      };

      // Create first profile
      await profileConcept.create(profileData);

      // Try to create duplicate
      const duplicateData = {
        profile: testProfileId + '-duplicate',
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Duplicate profile',
        timezone: 'UTC'
      };

      const result = await profileConcept.create(duplicateData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Profile of this type already exists for user');
      }
    });

    test('should allow multiple profiles for different types', async () => {
      const expertProfile = {
        profile: testProfileId + '-expert',
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Expert profile',
        timezone: 'UTC'
      };

      const partnerProfile = {
        profile: testProfileId + '-partner',
        userEntity: testUserId,
        profileType: 'industry_partner',
        bio: 'Industry partner profile',
        timezone: 'UTC'
      };

      const expertResult = await profileConcept.create(expertProfile);
      const partnerResult = await profileConcept.create(partnerProfile);

      expect(expertResult).toHaveProperty('profile');
      expect(partnerResult).toHaveProperty('profile');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Original bio',
        timezone: 'UTC'
      });
    });

    test('should update profile fields successfully', async () => {
      const updateData = {
        profile: testProfileId,
        bio: 'Updated bio with new information',
        title: 'Lead AI Engineer',
        company: 'New Company',
        linkedinUrl: 'https://linkedin.com/in/test',
        website: 'https://example.com',
        timezone: 'America/Los_Angeles',
        hourlyRate: 150.00
      };

      const result = await profileConcept.update(updateData);

      expect(result).toHaveProperty('profile');
      if ('profile' in result) {
        expect(result.profile.bio).toBe(updateData.bio);
        expect(result.profile.title).toBe(updateData.title);
        expect(result.profile.company).toBe(updateData.company);
        expect(result.profile.linkedinUrl).toBe(updateData.linkedinUrl);
        expect(result.profile.website).toBe(updateData.website);
        expect(result.profile.timezone).toBe(updateData.timezone);
        expect(result.profile.hourlyRate).toBe(updateData.hourlyRate);
      }
    });

    test('should handle partial updates', async () => {
      const updateData = {
        profile: testProfileId,
        bio: 'Only updating bio'
      };

      const result = await profileConcept.update(updateData);

      expect(result).toHaveProperty('profile');
      if ('profile' in result) {
        expect(result.profile.bio).toBe(updateData.bio);
        // Other fields should remain unchanged
        expect(result.profile.timezone).toBe('UTC');
      }
    });
  });

  describe('addSkill', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('profile no longer supports addSkill (use Skill concept)', async () => {
      expect(typeof (profileConcept as any).addSkill).toBe('undefined');
    });

    test('profile does not manage skills directly', async () => {
      expect(typeof (profileConcept as any).addSkill).toBe('undefined');
    });

    test('profile does not manage skills directly (no optional fields test)', async () => {
      expect(typeof (profileConcept as any).addSkill).toBe('undefined');
    });
  });

  describe('updateSkill', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('profile no longer supports updateSkill', async () => {
      expect(typeof (profileConcept as any).updateSkill).toBe('undefined');
    });
  });

  describe('removeSkill', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('profile no longer supports removeSkill', async () => {
      expect(typeof (profileConcept as any).removeSkill).toBe('undefined');
    });
  });

  describe('addLanguage', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('languages now modeled as skills or relationships; no direct addLanguage', async () => {
      expect(typeof (profileConcept as any).addLanguage).toBe('undefined');
    });
  });

  describe('verify', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('should verify profile successfully', async () => {
      const result = await profileConcept.verify({ profile: testProfileId });

      expect(result).toHaveProperty('profile');
      if ('profile' in result) {
        expect(result.profile.isVerified).toBe(true);
      }
    });
  });

  describe('recordProjectCompletion', () => {
    test('profile no longer supports recordProjectCompletion', async () => {
      expect(typeof (profileConcept as any).recordProjectCompletion).toBe('undefined');
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test profiles
      await profileConcept.create({
        profile: testProfileId + '-expert',
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Expert profile',
        company: 'Tech Corp',
        timezone: 'UTC'
      });

      await profileConcept.create({
        profile: testProfileId + '-partner',
        userEntity: testUserId + '-2',
        profileType: 'industry_partner',
        bio: 'Partner profile',
        company: 'Corp Inc',
        timezone: 'UTC'
      });

      // Verify one profile
      await profileConcept.verify({ profile: testProfileId + '-expert' });
    });

    test('_getByProfile should return specific profile', async () => {
      const profiles = await profileConcept._getByProfile({ 
        profile: testProfileId + '-expert' 
      });

      expect(profiles).toHaveLength(1);
      expect(profiles[0].profile).toBe(testProfileId + '-expert');
    });

    test('_getByUser should return all profiles for user', async () => {
      const profiles = await profileConcept._getByUser({ userEntity: testUserId });

      expect(profiles).toHaveLength(1);
      expect(profiles[0].userEntity).toBe(testUserId);
    });

    test('_getByType should return profiles of specific type', async () => {
      const experts = await profileConcept._getByType({ profileType: 'expert' });
      const partners = await profileConcept._getByType({ profileType: 'industry_partner' });

      expect(experts.length).toBeGreaterThanOrEqual(1);
      expect(partners.length).toBeGreaterThanOrEqual(1);
      expect(experts[0].profileType).toBe('expert');
      expect(partners[0].profileType).toBe('industry_partner');
    });

    // Skill-based queries moved out of Profile

    test('_getVerified should return only verified profiles', async () => {
      const verified = await profileConcept._getVerified();

      expect(verified.length).toBeGreaterThanOrEqual(1);
      expect(verified.every(p => p.isVerified)).toBe(true);
    });

    test('_getByCompany should return profiles from specific company', async () => {
      const techCorpProfiles = await profileConcept._getByCompany({ 
        company: 'Tech Corp' 
      });

      expect(techCorpProfiles.length).toBeGreaterThanOrEqual(1);
      expect(techCorpProfiles[0].company).toBe('Tech Corp');
    });

    test('_getTopRated should return profiles ordered by rating', async () => {
      const topRated = await profileConcept._getTopRated({ limit: 5 });
      expect(Array.isArray(topRated)).toBe(true);
    });

    // Profile no longer exposes direct skills

    test('_getAvailableForProject moved to syncs', async () => {
      expect(typeof (profileConcept as any)._getAvailableForProject).toBe('undefined');
    });
  });

  describe('activation and deactivation', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('should deactivate profile', async () => {
      const result = await profileConcept.deactivate({ profile: testProfileId });

      expect(result).toHaveProperty('profile');
      if ('profile' in result) {
        expect(result.profile.isActive).toBe(false);
      }
    });

    test('should reactivate profile', async () => {
      await profileConcept.deactivate({ profile: testProfileId });
      
      const result = await profileConcept.activate({ profile: testProfileId });

      expect(result).toHaveProperty('profile');
      if ('profile' in result) {
        expect(result.profile.isActive).toBe(true);
      }
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await profileConcept.create({
        profile: testProfileId,
        userEntity: testUserId,
        profileType: 'expert',
        bio: 'Test profile',
        timezone: 'UTC'
      });
    });

    test('should delete profile', async () => {
      const result = await profileConcept.delete({ profile: testProfileId });

      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
      }

      // Verify profile is deleted
      const profiles = await profileConcept._getByProfile({ profile: testProfileId });
      expect(profiles).toHaveLength(0);

      // Related skills/languages handled via Skill/Relationship concepts
    });
  });
});
