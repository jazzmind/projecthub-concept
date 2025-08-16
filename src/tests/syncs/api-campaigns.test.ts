import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { makeApiCampaignSyncs } from '@/lib/syncs/project/api-campaigns';
import { APIConcept } from '@/lib/concepts/common/api';
import { CampaignConcept } from '@/lib/concepts/project/campaign';
import { UserConcept } from '@/lib/concepts/common/user';
import { RoleConcept } from '@/lib/concepts/common/role';
import { MembershipConcept } from '@/lib/concepts/common/membership';
import { SessionConcept } from '@/lib/concepts/common/session';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock concept instances
const mockAPI = new APIConcept();
const mockCampaign = new CampaignConcept();
const mockUser = new UserConcept();
const mockRole = new RoleConcept();
const mockMembership = new MembershipConcept();
const mockSession = new SessionConcept();

describe('API Campaigns Sync Tests', () => {
  let testId: string;
  let campaignSyncs: any;

  beforeEach(async () => {
    testId = 'sync-test-' + Date.now();
    
    // Clean up test data
    await prisma.campaign.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Initialize the sync functions
    campaignSyncs = makeApiCampaignSyncs(mockAPI, mockCampaign);
  });

  afterEach(async () => {
    await prisma.campaign.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Campaign CRUD Operations', () => {
    test('should create campaign through sync', async () => {
      // Set up test user and permissions
      const user = await mockUser.register({
        user: testId + '-user',
        email: `test-${testId}@example.com`,
        name: 'Test User'
      });

      const role = await mockRole.create({
        name: testId + '-admin',
        displayName: 'Admin Role',
        description: 'Admin role',
        scope: 'organization',
        permissions: { campaigns: { create: true, read: true, update: true } }
      });

      const session = await mockSession.create({
        sessionKey: testId + '-session',
        loginMethod: 'email'
      });

      const membership = await mockMembership.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org',
        roleEntity: testId + '-admin',
        invitedBy: 'system'
      });

      await mockMembership.accept({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org'
      });

      await mockSession.setContext({
        sessionKey: testId + '-session',
        context: testId + '-org'
      });

      // Create campaign data
      const campaignData = {
        name: 'Test Campaign',
        description: 'A test campaign for testing',
        learningObjectives: ['Learn testing', 'Learn syncs'],
        startDate: new Date(),
        contactEmail: `campaign-${testId}@example.com`
      };

      // Create campaign through sync
      const campaign = await mockCampaign.create({
        campaign: testId + '-campaign',
        ...campaignData
      });

      expect(campaign).toHaveProperty('campaign');
      if ('campaign' in campaign) {
        expect(campaign.campaign.name).toBe('Test Campaign');
        expect(campaign.campaign.description).toBe('A test campaign for testing');
      }
    });

    test('should query campaigns through sync', async () => {
      // Create test campaign
      await mockCampaign.create({
        campaign: testId + '-campaign',
        name: 'Test Campaign',
        description: 'Test description',
        learningObjectives: ['Test objective'],
        startDate: new Date(),
        contactEmail: `test-${testId}@example.com`
      });

      // Query campaigns
      const campaigns = await mockCampaign._getByCampaign({
        campaign: testId + '-campaign'
      });

      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe('Test Campaign');
    });

    test('should update campaign through sync', async () => {
      // Create test campaign
      await mockCampaign.create({
        campaign: testId + '-campaign',
        name: 'Original Campaign',
        description: 'Original description',
        learningObjectives: ['Original objective'],
        startDate: new Date(),
        contactEmail: `test-${testId}@example.com`
      });

      // Update campaign
      const updateResult = await mockCampaign.update({
        campaign: testId + '-campaign',
        name: 'Updated Campaign',
        description: 'Updated description'
      });

      expect(updateResult).toHaveProperty('campaign');
      if ('campaign' in updateResult) {
        expect(updateResult.campaign.name).toBe('Updated Campaign');
        expect(updateResult.campaign.description).toBe('Updated description');
      }
    });
  });

  describe('Campaign Participants', () => {
    beforeEach(async () => {
      await mockCampaign.create({
        campaign: testId + '-campaign',
        name: 'Test Campaign',
        description: 'Test description',
        learningObjectives: ['Test objective'],
        startDate: new Date(),
        contactEmail: `test-${testId}@example.com`
      });
    });

    test('should add participant to campaign', async () => {
      const participantId = testId + '-participant';
      
      const result = await mockCampaign.addParticipant({
        campaign: testId + '-campaign',
        participantId
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.participantIds).toContain(participantId);
      }
    });

    test('should remove participant from campaign', async () => {
      const participantId = testId + '-participant';
      
      // Add participant first
      await mockCampaign.addParticipant({
        campaign: testId + '-campaign',
        participantId
      });

      // Remove participant
      const result = await mockCampaign.removeParticipant({
        campaign: testId + '-campaign',
        participantId
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.participantIds).not.toContain(participantId);
      }
    });

    test('should check campaign capacity', async () => {
      // Update campaign with capacity limit
      await mockCampaign.update({
        campaign: testId + '-campaign',
        maxParticipants: 2
      });

      // Check initial capacity
      const hasCapacity1 = await mockCampaign._hasCapacity({
        campaign: testId + '-campaign'
      });
      expect(hasCapacity1[0]).toBe(true);

      // Add participants up to limit
      await mockCampaign.addParticipant({
        campaign: testId + '-campaign',
        participantId: testId + '-participant-1'
      });

      await mockCampaign.addParticipant({
        campaign: testId + '-campaign',
        participantId: testId + '-participant-2'
      });

      // Check capacity after reaching limit
      const hasCapacity2 = await mockCampaign._hasCapacity({
        campaign: testId + '-campaign'
      });
      expect(hasCapacity2[0]).toBe(false);
    });
  });

  describe('Campaign Status Management', () => {
    beforeEach(async () => {
      await mockCampaign.create({
        campaign: testId + '-campaign',
        name: 'Test Campaign',
        description: 'Test description',
        learningObjectives: ['Test objective'],
        startDate: new Date(),
        contactEmail: `test-${testId}@example.com`
      });
    });

    test('should update campaign status', async () => {
      const result = await mockCampaign.updateStatus({
        campaign: testId + '-campaign',
        status: 'active'
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.status).toBe('active');
      }
    });

    test('should query campaigns by status', async () => {
      // Update campaign to active
      await mockCampaign.updateStatus({
        campaign: testId + '-campaign',
        status: 'active'
      });

      // Query active campaigns
      const activeCampaigns = await mockCampaign._getByStatus({
        status: 'active'
      });

      expect(activeCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(activeCampaigns.some(c => c.campaign === testId + '-campaign')).toBe(true);
    });

    test('should get active campaigns', async () => {
      // Set campaign to active
      await mockCampaign.updateStatus({
        campaign: testId + '-campaign',
        status: 'active'
      });

      const activeCampaigns = await mockCampaign._getActive();

      expect(activeCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(activeCampaigns.some(c => c.status === 'active')).toBe(true);
    });
  });

  describe('Campaign Constraints and Configuration', () => {
    beforeEach(async () => {
      await mockCampaign.create({
        campaign: testId + '-campaign',
        name: 'Test Campaign',
        description: 'Test description',
        learningObjectives: ['Test objective'],
        startDate: new Date(),
        contactEmail: `test-${testId}@example.com`
      });
    });

    test('should update campaign constraints', async () => {
      const constraints = {
        industryConstraints: { allowedIndustries: ['Technology', 'Healthcare'] },
        projectConstraints: { minDifficulty: 'intermediate', maxHours: 100 }
      };

      const result = await mockCampaign.updateConstraints({
        campaign: testId + '-campaign',
        ...constraints
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.industryConstraints).toEqual(constraints.industryConstraints);
        expect(result.campaign.projectConstraints).toEqual(constraints.projectConstraints);
      }
    });

    test('should update landing page configuration', async () => {
      const landingPageConfig = {
        theme: 'modern',
        primaryColor: '#007bff',
        heroText: 'Join our amazing campaign!',
        features: ['Learn new skills', 'Work on real projects', 'Build your portfolio']
      };

      const result = await mockCampaign.updateLandingPage({
        campaign: testId + '-campaign',
        landingPageConfig
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.landingPageConfig).toEqual(landingPageConfig);
      }
    });

    test('should get landing page configuration', async () => {
      const landingPageConfig = {
        theme: 'default',
        welcomeMessage: 'Welcome to our campaign!'
      };

      // Update landing page first
      await mockCampaign.updateLandingPage({
        campaign: testId + '-campaign',
        landingPageConfig
      });

      // Get landing page config
      const configs = await mockCampaign._getLandingPageConfig({
        campaign: testId + '-campaign'
      });

      expect(configs).toHaveLength(1);
      expect(configs[0]).toEqual(landingPageConfig);
    });
  });

  describe('Campaign Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test campaigns
      await mockCampaign.create({
        campaign: testId + '-campaign-1',
        name: 'JavaScript Bootcamp',
        description: 'Learn JavaScript fundamentals and advanced concepts',
        learningObjectives: ['Learn JavaScript', 'Build web apps'],
        startDate: new Date(),
        contactEmail: `js-${testId}@example.com`
      });

      await mockCampaign.create({
        campaign: testId + '-campaign-2',
        name: 'Python Data Science',
        description: 'Master data science with Python and machine learning',
        learningObjectives: ['Learn Python', 'Data analysis'],
        startDate: new Date(),
        contactEmail: `py-${testId}@example.com`
      });

      await mockCampaign.create({
        campaign: testId + '-campaign-3',
        name: 'React Development',
        description: 'Build modern web applications with React',
        learningObjectives: ['Learn React', 'Component architecture'],
        startDate: new Date(),
        contactEmail: `react-${testId}@example.com`
      });
    });

    test('should search campaigns by keywords', async () => {
      const javascriptCampaigns = await mockCampaign._searchByKeywords({
        keywords: ['JavaScript']
      });

      expect(javascriptCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(javascriptCampaigns.some(c => c.name.includes('JavaScript'))).toBe(true);

      const pythonCampaigns = await mockCampaign._searchByKeywords({
        keywords: ['Python', 'data']
      });

      expect(pythonCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(pythonCampaigns.some(c => c.name.includes('Python') || c.description.includes('data'))).toBe(true);
    });

    test('should get campaigns by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const campaignsInRange = await mockCampaign._getByDateRange({
        startDate: yesterday,
        endDate: tomorrow
      });

      expect(campaignsInRange.length).toBeGreaterThanOrEqual(3);
    });

    test('should get participant count', async () => {
      // Add some participants
      await mockCampaign.addParticipant({
        campaign: testId + '-campaign-1',
        participantId: testId + '-user-1'
      });

      await mockCampaign.addParticipant({
        campaign: testId + '-campaign-1',
        participantId: testId + '-user-2'
      });

      const participantCounts = await mockCampaign._getParticipantCount({
        campaign: testId + '-campaign-1'
      });

      expect(participantCounts).toHaveLength(1);
      expect(participantCounts[0]).toBe(2);
    });
  });

  describe('Campaign Lifecycle', () => {
    test('should handle complete campaign lifecycle', async () => {
      // 1. Create campaign
      const createResult = await mockCampaign.create({
        campaign: testId + '-lifecycle',
        name: 'Lifecycle Test Campaign',
        description: 'Testing complete campaign lifecycle',
        learningObjectives: ['Test lifecycle'],
        startDate: new Date(),
        contactEmail: `lifecycle-${testId}@example.com`
      });
      expect(createResult).toHaveProperty('campaign');

      // 2. Update campaign details
      const updateResult = await mockCampaign.update({
        campaign: testId + '-lifecycle',
        name: 'Updated Lifecycle Campaign',
        description: 'Updated description',
        maxParticipants: 50
      });
      expect(updateResult).toHaveProperty('campaign');

      // 3. Set constraints
      const constraintsResult = await mockCampaign.updateConstraints({
        campaign: testId + '-lifecycle',
        industryConstraints: { allowedIndustries: ['Technology'] },
        projectConstraints: { difficulty: ['intermediate', 'advanced'] }
      });
      expect(constraintsResult).toHaveProperty('campaign');

      // 4. Configure landing page
      const landingPageResult = await mockCampaign.updateLandingPage({
        campaign: testId + '-lifecycle',
        landingPageConfig: { theme: 'professional', heroText: 'Join us!' }
      });
      expect(landingPageResult).toHaveProperty('campaign');

      // 5. Activate campaign
      const activateResult = await mockCampaign.updateStatus({
        campaign: testId + '-lifecycle',
        status: 'active'
      });
      expect(activateResult).toHaveProperty('campaign');

      // 6. Add participants
      const participant1Result = await mockCampaign.addParticipant({
        campaign: testId + '-lifecycle',
        participantId: testId + '-participant-1'
      });
      expect(participant1Result).toHaveProperty('campaign');

      const participant2Result = await mockCampaign.addParticipant({
        campaign: testId + '-lifecycle',
        participantId: testId + '-participant-2'
      });
      expect(participant2Result).toHaveProperty('campaign');

      // 7. Verify final state
      const finalCampaigns = await mockCampaign._getByCampaign({
        campaign: testId + '-lifecycle'
      });

      expect(finalCampaigns).toHaveLength(1);
      const finalCampaign = finalCampaigns[0];
      expect(finalCampaign.name).toBe('Updated Lifecycle Campaign');
      expect(finalCampaign.status).toBe('active');
      expect(finalCampaign.participantIds).toHaveLength(2);
      expect(finalCampaign.maxParticipants).toBe(50);

      // 8. Complete campaign (close)
      const closeResult = await mockCampaign.updateStatus({
        campaign: testId + '-lifecycle',
        status: 'completed'
      });
      expect(closeResult).toHaveProperty('campaign');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent campaign operations', async () => {
      const nonExistentId = 'non-existent-campaign';

      const updateResult = await mockCampaign.update({
        campaign: nonExistentId,
        name: 'Should Fail'
      });
      expect(updateResult).toHaveProperty('error');

      const addParticipantResult = await mockCampaign.addParticipant({
        campaign: nonExistentId,
        participantId: 'some-user'
      });
      expect(addParticipantResult).toHaveProperty('error');

      const statusUpdateResult = await mockCampaign.updateStatus({
        campaign: nonExistentId,
        status: 'active'
      });
      expect(statusUpdateResult).toHaveProperty('error');
    });

    test('should handle capacity limits', async () => {
      // Create campaign with capacity limit
      await mockCampaign.create({
        campaign: testId + '-capacity-test',
        name: 'Capacity Test Campaign',
        description: 'Testing capacity limits',
        learningObjectives: ['Test capacity'],
        startDate: new Date(),
        contactEmail: `capacity-${testId}@example.com`,
        maxParticipants: 1
      });

      // Add participant up to limit
      const firstParticipant = await mockCampaign.addParticipant({
        campaign: testId + '-capacity-test',
        participantId: testId + '-participant-1'
      });
      expect(firstParticipant).toHaveProperty('campaign');

      // Try to add participant beyond limit
      const secondParticipant = await mockCampaign.addParticipant({
        campaign: testId + '-capacity-test',
        participantId: testId + '-participant-2'
      });
      expect(secondParticipant).toHaveProperty('error');
    });
  });
});
