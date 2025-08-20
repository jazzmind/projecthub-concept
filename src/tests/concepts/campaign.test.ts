import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { CampaignConcept } from '@/lib/concepts/project/campaign';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const campaignConcept = new CampaignConcept();

describe('CampaignConcept', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'campaign-test-' + Date.now();
    
    // Clean up test data
    await prisma.campaign.deleteMany({});
  });

  afterEach(async () => {
    await prisma.campaign.deleteMany({});
  });

  describe('create', () => {
    test('should create campaign successfully', async () => {
      const campaignData = {
        campaign: testId + '-campaign',
        name: 'Web Development Bootcamp',
        description: 'Intensive 12-week program covering full-stack web development',
        learningObjectives: [
          'Master HTML, CSS, and JavaScript fundamentals',
          'Build responsive web applications with React',
          'Create RESTful APIs with Node.js and Express',
          'Work with databases using MongoDB and PostgreSQL',
          'Deploy applications to cloud platforms'
        ],
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-24'),
        contactEmail: `bootcamp@${testId}.com`,
        website: `https://bootcamp-${testId}.com`,
        maxParticipants: 30
      };

      const result = await campaignConcept.create(campaignData);

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.campaign).toBe(testId + '-campaign');
        expect(result.campaign.name).toBe('Web Development Bootcamp');
        expect(result.campaign.description).toBe(campaignData.description);
        expect(result.campaign.learningObjectives).toEqual(campaignData.learningObjectives);
        expect(result.campaign.startDate).toEqual(campaignData.startDate);
        expect(result.campaign.endDate).toEqual(campaignData.endDate);
        expect(result.campaign.contactEmail).toBe(campaignData.contactEmail);
        expect(result.campaign.maxParticipants).toBe(30);
        expect(result.campaign.status).toBe('draft');
        expect(result.campaign.participantIds).toEqual([]);
        expect(result.campaign.isActive).toBe(true);
      }
    });

    test('should create campaign with minimal required fields', async () => {
      const minimalCampaignData = {
        campaign: testId + '-minimal',
        name: 'Minimal Campaign',
        description: 'Campaign with only required fields',
        learningObjectives: ['Learn the basics'],
        startDate: new Date(),
        contactEmail: `minimal@${testId}.com`
      };

      const result = await campaignConcept.create(minimalCampaignData);

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.name).toBe('Minimal Campaign');
        expect(result.campaign.endDate).toBeNull();
        expect(result.campaign.website).toBeNull();
        expect(result.campaign.maxParticipants).toBeNull();
      }
    });

    test('should prevent duplicate campaign identifiers', async () => {
      const campaignId = testId + '-duplicate';
      
      // Create first campaign
      await campaignConcept.create({
        campaign: campaignId,
        name: 'First Campaign',
        description: 'First campaign description',
        learningObjectives: ['First objective'],
        startDate: new Date(),
        contactEmail: `first@${testId}.com`
      });

      // Try to create duplicate
      const duplicateResult = await campaignConcept.create({
        campaign: campaignId,
        name: 'Duplicate Campaign',
        description: 'Duplicate campaign description',
        learningObjectives: ['Duplicate objective'],
        startDate: new Date(),
        contactEmail: `duplicate@${testId}.com`
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('campaign');
      }
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await campaignConcept.create({
        campaign: testId + '-update-test',
        name: 'Original Campaign Name',
        description: 'Original description',
        learningObjectives: ['Original objective'],
        startDate: new Date(),
        contactEmail: `original@${testId}.com`
      });
    });

    test('should update campaign details', async () => {
      const updateData = {
        campaign: testId + '-update-test',
        name: 'Updated Campaign Name',
        description: 'Updated description with more comprehensive information',
        learningObjectives: [
          'Updated objective 1',
          'Updated objective 2',
          'New objective 3'
        ],
        endDate: new Date('2024-12-31'),
        website: `https://updated-${testId}.com`,
        maxParticipants: 50
      };

      const result = await campaignConcept.update(updateData);

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.name).toBe('Updated Campaign Name');
        expect(result.campaign.description).toBe(updateData.description);
        expect(result.campaign.learningObjectives).toEqual(updateData.learningObjectives);
        expect(result.campaign.endDate).toEqual(updateData.endDate);
        expect(result.campaign.website).toBe(updateData.website);
        expect(result.campaign.maxParticipants).toBe(50);
      }
    });

    test('should handle partial updates', async () => {
      const partialUpdate = {
        campaign: testId + '-update-test',
        name: 'Only Name Updated'
      };

      const result = await campaignConcept.update(partialUpdate);

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.name).toBe('Only Name Updated');
        expect(result.campaign.description).toBe('Original description'); // Should remain unchanged
      }
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await campaignConcept.create({
        campaign: testId + '-status-test',
        name: 'Status Test Campaign',
        description: 'Campaign for status testing',
        learningObjectives: ['Test status changes'],
        startDate: new Date(),
        contactEmail: `status@${testId}.com`
      });
    });

    test('should update campaign status to active', async () => {
      const result = await campaignConcept.updateStatus({
        campaign: testId + '-status-test',
        status: 'active'
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.status).toBe('active');
      }
    });

    test('should update campaign status to completed', async () => {
      // First set to active
      await campaignConcept.updateStatus({
        campaign: testId + '-status-test',
        status: 'active'
      });

      // Then complete
      const result = await campaignConcept.updateStatus({
        campaign: testId + '-status-test',
        status: 'completed'
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.status).toBe('completed');
      }
    });

    test('should update campaign status to cancelled', async () => {
      const result = await campaignConcept.updateStatus({
        campaign: testId + '-status-test',
        status: 'cancelled'
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.status).toBe('cancelled');
      }
    });
  });

  describe('participant management', () => {
    beforeEach(async () => {
      await campaignConcept.create({
        campaign: testId + '-participants-test',
        name: 'Participant Management Test',
        description: 'Campaign for testing participant features',
        learningObjectives: ['Test participant management'],
        startDate: new Date(),
        contactEmail: `participants@${testId}.com`,
        maxParticipants: 3
      });
    });

    test('should add participants to campaign', async () => {
      const participantId1 = testId + '-participant-1';
      const participantId2 = testId + '-participant-2';

      // Add first participant
      const result1 = await campaignConcept.addParticipant({
        campaign: testId + '-participants-test',
        participantId: participantId1
      });

      expect(result1).toHaveProperty('campaign');
      if ('campaign' in result1) {
        expect(result1.campaign.participantIds).toContain(participantId1);
      }

      // Add second participant
      const result2 = await campaignConcept.addParticipant({
        campaign: testId + '-participants-test',
        participantId: participantId2
      });

      expect(result2).toHaveProperty('campaign');
      if ('campaign' in result2) {
        expect(result2.campaign.participantIds).toContain(participantId1);
        expect(result2.campaign.participantIds).toContain(participantId2);
        expect(result2.campaign.participantIds).toHaveLength(2);
      }
    });

    test('should remove participants from campaign', async () => {
      const participantId = testId + '-remove-participant';

      // Add participant first
      await campaignConcept.addParticipant({
        campaign: testId + '-participants-test',
        participantId
      });

      // Remove participant
      const result = await campaignConcept.removeParticipant({
        campaign: testId + '-participants-test',
        participantId
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.participantIds).not.toContain(participantId);
      }
    });

    test('should prevent adding duplicate participants', async () => {
      const participantId = testId + '-duplicate-participant';

      // Add participant first time
      await campaignConcept.addParticipant({
        campaign: testId + '-participants-test',
        participantId
      });

      // Try to add same participant again
      const duplicateResult = await campaignConcept.addParticipant({
        campaign: testId + '-participants-test',
        participantId
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('already');
      }
    });

    test('should enforce capacity limits', async () => {
      const participants = [
        testId + '-participant-1',
        testId + '-participant-2',
        testId + '-participant-3',
        testId + '-participant-4' // This should exceed the limit of 3
      ];

      // Add participants up to limit
      for (let i = 0; i < 3; i++) {
        const result = await campaignConcept.addParticipant({
          campaign: testId + '-participants-test',
          participantId: participants[i]
        });
        expect(result).toHaveProperty('campaign');
      }

      // Try to add participant beyond limit
      const overLimitResult = await campaignConcept.addParticipant({
        campaign: testId + '-participants-test',
        participantId: participants[3]
      });

      expect(overLimitResult).toHaveProperty('error');
      if ('error' in overLimitResult) {
        expect(overLimitResult.error).toContain('capacity') || 
        expect(overLimitResult.error).toContain('full') ||
        expect(overLimitResult.error).toContain('limit');
      }
    });
  });

  describe('constraints and configuration', () => {
    beforeEach(async () => {
      await campaignConcept.create({
        campaign: testId + '-constraints-test',
        name: 'Constraints Test Campaign',
        description: 'Campaign for testing constraints and configuration',
        learningObjectives: ['Test constraints'],
        startDate: new Date(),
        contactEmail: `constraints@${testId}.com`
      });
    });

    test('should update industry constraints', async () => {
      const constraints = {
        allowedIndustries: ['Technology', 'Healthcare', 'Finance'],
        restrictedIndustries: ['Gambling', 'Tobacco'],
        experienceLevel: 'intermediate'
      };

      const result = await campaignConcept.updateConstraints({
        campaign: testId + '-constraints-test',
        industryConstraints: constraints
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.industryConstraints).toEqual(constraints);
      }
    });

    test('should update project constraints', async () => {
      const constraints = {
        minDifficulty: 'intermediate',
        maxDifficulty: 'advanced',
        maxHours: 120,
        preferredSkills: ['TypeScript', 'GraphQL']
      };

      const result = await campaignConcept.updateConstraints({
        campaign: testId + '-constraints-test',
        projectConstraints: constraints
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.projectConstraints).toEqual(constraints);
      }
    });

    test('should update landing page configuration', async () => {
      const landingPageConfig = {
        theme: 'modern',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        heroText: 'Join our amazing web development bootcamp!',
        heroSubtext: 'Learn to build modern web applications in 12 weeks',
        features: [
          'Expert-led instruction',
          'Hands-on projects',
          'Industry partnerships',
          'Career support'
        ],
        testimonials: [
          {
            name: 'John Doe',
            text: 'This bootcamp changed my career!',
            company: 'Tech Corp'
          }
        ],
        faqItems: [
          {
            question: 'What is the time commitment?',
            answer: 'Full-time program requiring 40+ hours per week'
          }
        ]
      };

      const result = await campaignConcept.updateLandingPage({
        campaign: testId + '-constraints-test',
        landingPageConfig
      });

      expect(result).toHaveProperty('campaign');
      if ('campaign' in result) {
        expect(result.campaign.landingPageConfig).toEqual(landingPageConfig);
      }
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test campaigns
      const campaigns = [
        {
          campaign: testId + '-web-bootcamp',
          name: 'Web Development Bootcamp',
          description: 'Learn modern web development with React and Node.js',
          learningObjectives: ['Learn React', 'Learn Node.js', 'Build full-stack apps'],
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-05-24'),
          contactEmail: `web@${testId}.com`,
          status: 'active'
        },
        {
          campaign: testId + '-data-science',
          name: 'Data Science Program',
          description: 'Comprehensive data science and machine learning course',
          learningObjectives: ['Learn Python', 'Master machine learning', 'Work with big data'],
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-07-01'),
          contactEmail: `data@${testId}.com`,
          status: 'draft'
        },
        {
          campaign: testId + '-mobile-dev',
          name: 'Mobile Development Course',
          description: 'Build native and cross-platform mobile applications',
          learningObjectives: ['Learn React Native', 'Learn Flutter', 'Publish apps'],
          startDate: new Date('2024-02-15'),
          endDate: new Date('2024-04-30'),
          contactEmail: `mobile@${testId}.com`,
          status: 'completed'
        }
      ];

      for (const campaignData of campaigns) {
        await campaignConcept.create(campaignData);
        if (campaignData.status !== 'draft') {
          await campaignConcept.updateStatus({
            campaign: campaignData.campaign,
            status: campaignData.status
          });
        }
      }

      // Add participants to some campaigns
      await campaignConcept.addParticipant({
        campaign: testId + '-web-bootcamp',
        participantId: testId + '-participant-1'
      });

      await campaignConcept.addParticipant({
        campaign: testId + '-web-bootcamp',
        participantId: testId + '-participant-2'
      });
    });

    test('should query campaign by identifier', async () => {
      const campaigns = await campaignConcept._getByCampaign({
        campaign: testId + '-web-bootcamp'
      });

      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe('Web Development Bootcamp');
    });

    test('should query campaigns by status', async () => {
      const activeCampaigns = await campaignConcept._getByStatus({ status: 'active' });
      const draftCampaigns = await campaignConcept._getByStatus({ status: 'draft' });
      const completedCampaigns = await campaignConcept._getByStatus({ status: 'completed' });

      expect(activeCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(draftCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(completedCampaigns.length).toBeGreaterThanOrEqual(1);

      expect(activeCampaigns.every(c => c.status === 'active')).toBe(true);
      expect(draftCampaigns.every(c => c.status === 'draft')).toBe(true);
      expect(completedCampaigns.every(c => c.status === 'completed')).toBe(true);
    });

    test('should get active campaigns', async () => {
      const activeCampaigns = await campaignConcept._getActive();

      expect(activeCampaigns.length).toBeGreaterThanOrEqual(1);
      expect(activeCampaigns.every(c => c.status === 'active')).toBe(true);
    });

    test('should search campaigns by keywords', async () => {
      const webSearchResults = await campaignConcept._searchByKeywords({
        keywords: ['web', 'React']
      });

      expect(webSearchResults.length).toBeGreaterThanOrEqual(1);
      expect(webSearchResults.some(c => 
        c.name.includes('Web') || 
        c.description.includes('React') ||
        c.learningObjectives.some(obj => obj.includes('React'))
      )).toBe(true);

      const dataSearchResults = await campaignConcept._searchByKeywords({
        keywords: ['data', 'machine learning']
      });

      expect(dataSearchResults.length).toBeGreaterThanOrEqual(1);
      expect(dataSearchResults.some(c => 
        c.name.includes('Data') || 
        c.description.includes('machine learning')
      )).toBe(true);
    });

    test('should get campaigns by date range', async () => {
      const startRange = new Date('2024-02-01');
      const endRange = new Date('2024-04-30');

      const campaignsInRange = await campaignConcept._getByDateRange({
        startDate: startRange,
        endDate: endRange
      });

      expect(campaignsInRange.length).toBeGreaterThanOrEqual(2);
      
      campaignsInRange.forEach(campaign => {
        expect(campaign.startDate.getTime()).toBeGreaterThanOrEqual(startRange.getTime());
        expect(campaign.startDate.getTime()).toBeLessThanOrEqual(endRange.getTime());
      });
    });

    test('should check campaign capacity', async () => {
      const hasCapacity = await campaignConcept._hasCapacity({
        campaign: testId + '-web-bootcamp'
      });

      expect(hasCapacity).toHaveLength(1);
      expect(typeof hasCapacity[0]).toBe('boolean');
    });

    test('should get participant count', async () => {
      const participantCount = await campaignConcept._getParticipantCount({
        campaign: testId + '-web-bootcamp'
      });

      expect(participantCount).toHaveLength(1);
      expect(participantCount[0]).toBe(2);
    });

    test('should get landing page configuration', async () => {
      // First set up landing page config
      const config = {
        theme: 'professional',
        heroText: 'Join our bootcamp!',
        features: ['Expert instructors', 'Real projects']
      };

      await campaignConcept.updateLandingPage({
        campaign: testId + '-web-bootcamp',
        landingPageConfig: config
      });

      // Then query it
      const landingPageConfigs = await campaignConcept._getLandingPageConfig({
        campaign: testId + '-web-bootcamp'
      });

      expect(landingPageConfigs).toHaveLength(1);
      expect(landingPageConfigs[0]).toEqual(config);
    });
  });

  describe('campaign lifecycle', () => {
    test('should handle complete campaign lifecycle', async () => {
      const campaignId = testId + '-lifecycle';

      // 1. Create campaign
      const createResult = await campaignConcept.create({
        campaign: campaignId,
        name: 'Complete Lifecycle Campaign',
        description: 'Testing complete campaign lifecycle',
        learningObjectives: ['Test all features'],
        startDate: new Date(),
        contactEmail: `lifecycle@${testId}.com`,
        maxParticipants: 5
      });
      expect(createResult).toHaveProperty('campaign');

      // 2. Update campaign details
      const updateResult = await campaignConcept.update({
        campaign: campaignId,
        description: 'Updated description with comprehensive information',
        endDate: new Date('2024-12-31'),
        website: `https://lifecycle-${testId}.com`
      });
      expect(updateResult).toHaveProperty('campaign');

      // 3. Set constraints
      const constraintsResult = await campaignConcept.updateConstraints({
        campaign: campaignId,
        industryConstraints: { allowedIndustries: ['Technology'] },
        projectConstraints: { minDifficulty: 'intermediate' }
      });
      expect(constraintsResult).toHaveProperty('campaign');

      // 4. Configure landing page
      const landingPageResult = await campaignConcept.updateLandingPage({
        campaign: campaignId,
        landingPageConfig: {
          theme: 'modern',
          heroText: 'Join our amazing program!',
          features: ['Expert instruction', 'Real projects']
        }
      });
      expect(landingPageResult).toHaveProperty('campaign');

      // 5. Activate campaign
      const activateResult = await campaignConcept.updateStatus({
        campaign: campaignId,
        status: 'active'
      });
      expect(activateResult).toHaveProperty('campaign');

      // 6. Add participants
      const participant1Result = await campaignConcept.addParticipant({
        campaign: campaignId,
        participantId: testId + '-lifecycle-participant-1'
      });
      expect(participant1Result).toHaveProperty('campaign');

      const participant2Result = await campaignConcept.addParticipant({
        campaign: campaignId,
        participantId: testId + '-lifecycle-participant-2'
      });
      expect(participant2Result).toHaveProperty('campaign');

      // 7. Check campaign state
      const finalCampaigns = await campaignConcept._getByCampaign({
        campaign: campaignId
      });

      expect(finalCampaigns).toHaveLength(1);
      const finalCampaign = finalCampaigns[0];
      expect(finalCampaign.status).toBe('active');
      expect(finalCampaign.participantIds).toHaveLength(2);
      expect(finalCampaign.description).toContain('comprehensive');
      expect(finalCampaign.website).toBe(`https://lifecycle-${testId}.com`);

      // 8. Complete campaign
      const completeResult = await campaignConcept.updateStatus({
        campaign: campaignId,
        status: 'completed'
      });
      expect(completeResult).toHaveProperty('campaign');
      if ('campaign' in completeResult) {
        expect(completeResult.campaign.status).toBe('completed');
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle operations on non-existent campaign', async () => {
      const nonExistentId = 'non-existent-campaign';

      const updateResult = await campaignConcept.update({
        campaign: nonExistentId,
        name: 'Should Fail'
      });
      expect(updateResult).toHaveProperty('error');

      const statusResult = await campaignConcept.updateStatus({
        campaign: nonExistentId,
        status: 'active'
      });
      expect(statusResult).toHaveProperty('error');

      const participantResult = await campaignConcept.addParticipant({
        campaign: nonExistentId,
        participantId: 'some-participant'
      });
      expect(participantResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidCampaignData = {
        campaign: testId + '-invalid',
        name: '', // Empty name
        description: 'Valid description',
        learningObjectives: ['Valid objective'],
        startDate: new Date(),
        contactEmail: `invalid@${testId}.com`
      };

      const result = await campaignConcept.create(invalidCampaignData);
      expect(result).toHaveProperty('error');
    });

    test('should validate email format', async () => {
      const invalidEmailData = {
        campaign: testId + '-invalid-email',
        name: 'Valid Campaign',
        description: 'Valid description',
        learningObjectives: ['Valid objective'],
        startDate: new Date(),
        contactEmail: 'invalid-email-format'
      };

      const result = await campaignConcept.create(invalidEmailData);
      expect(result).toHaveProperty('error');
    });

    test('should validate learning objectives', async () => {
      const invalidObjectivesData = {
        campaign: testId + '-invalid-objectives',
        name: 'Valid Campaign',
        description: 'Valid description',
        learningObjectives: [], // Empty objectives
        startDate: new Date(),
        contactEmail: `valid@${testId}.com`
      };

      const result = await campaignConcept.create(invalidObjectivesData);
      expect(result).toHaveProperty('error');
    });

    test('should validate date logic', async () => {
      const invalidDateData = {
        campaign: testId + '-invalid-dates',
        name: 'Valid Campaign',
        description: 'Valid description',
        learningObjectives: ['Valid objective'],
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-05-01'), // End before start
        contactEmail: `valid@${testId}.com`
      };

      const result = await campaignConcept.create(invalidDateData);
      expect(result).toHaveProperty('error');
    });
  });
});
