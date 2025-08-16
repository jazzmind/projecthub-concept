import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { OrganizationConcept } from '@/lib/concepts/common/organization';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const organizationConcept = new OrganizationConcept();

describe('OrganizationConcept', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'org-test-' + Date.now();
    
    // Clean up test data
    await prisma.organization.deleteMany({});
  });

  afterEach(async () => {
    await prisma.organization.deleteMany({});
  });

  describe('create', () => {
    test('should create education organization successfully', async () => {
      const orgData = {
        name: 'Test University',
        description: 'A leading educational institution',
        type: 'education',
        domain: `test-university-${testId}.edu`,
        contactEmail: `admin@test-university-${testId}.edu`,
        website: `https://test-university-${testId}.edu`
      };

      const result = await organizationConcept.create(orgData);

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.name).toBe('Test University');
        expect(result.organization.description).toBe('A leading educational institution');
        expect(result.organization.organizationType).toBe('education');
        expect(result.organization.domain).toBe(orgData.domain);
        expect(result.organization.contactEmail).toBe(orgData.contactEmail);
        expect(result.organization.isActive).toBe(true);
        expect(result.organization.isVerified).toBe(false);
      }
    });

    test('should create industry organization successfully', async () => {
      const orgData = {
        name: 'Tech Corp Industries',
        description: 'Leading technology solutions provider',
        type: 'industry',
        domain: `techcorp-${testId}.com`,
        contactEmail: `contact@techcorp-${testId}.com`,
        website: `https://techcorp-${testId}.com`
      };

      const result = await organizationConcept.create(orgData);

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.organizationType).toBe('industry');
        expect(result.organization.name).toBe('Tech Corp Industries');
      }
    });

    test('should create government organization successfully', async () => {
      const orgData = {
        name: 'Department of Innovation',
        description: 'Government agency focused on technological advancement',
        type: 'government',
        domain: `innovation-dept-${testId}.gov`,
        contactEmail: `info@innovation-dept-${testId}.gov`
      };

      const result = await organizationConcept.create(orgData);

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.organizationType).toBe('government');
        expect(result.organization.name).toBe('Department of Innovation');
      }
    });

    test('should create nonprofit organization successfully', async () => {
      const orgData = {
        name: 'Education for All Foundation',
        description: 'Nonprofit focused on accessible education',
        type: 'nonprofit',
        domain: `education-foundation-${testId}.org`,
        contactEmail: `contact@education-foundation-${testId}.org`
      };

      const result = await organizationConcept.create(orgData);

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.organizationType).toBe('nonprofit');
        expect(result.organization.name).toBe('Education for All Foundation');
      }
    });

    test('should prevent duplicate domain registration', async () => {
      const domain = `duplicate-${testId}.com`;
      
      // Create first organization
      await organizationConcept.create({
        name: 'First Organization',
        description: 'First org description',
        type: 'industry',
        domain,
        contactEmail: `first@${domain}`
      });

      // Try to create second organization with same domain
      const duplicateResult = await organizationConcept.create({
        name: 'Second Organization',
        description: 'Second org description',
        type: 'education',
        domain,
        contactEmail: `second@${domain}`
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('domain');
      }
    });

    test('should reject invalid organization type', async () => {
      const orgData = {
        name: 'Invalid Type Org',
        description: 'Organization with invalid type',
        type: 'invalid_type',
        domain: `invalid-${testId}.com`,
        contactEmail: `contact@invalid-${testId}.com`
      };

      const result = await organizationConcept.create(orgData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('type');
      }
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await organizationConcept.create({
        name: 'Original Organization',
        description: 'Original description',
        type: 'education',
        domain: `original-${testId}.edu`,
        contactEmail: `original@original-${testId}.edu`
      });
    });

    test('should update organization details', async () => {
      // Get the created organization ID
      const orgs = await organizationConcept._getByDomain({ 
        domain: `original-${testId}.edu` 
      });
      const orgId = orgs[0].organization;

      const updateData = {
        organization: orgId,
        name: 'Updated Organization Name',
        description: 'Updated description with more details',
        website: `https://updated-${testId}.edu`,
        contactEmail: `updated@original-${testId}.edu`
      };

      const result = await organizationConcept.update(updateData);

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.name).toBe('Updated Organization Name');
        expect(result.organization.description).toBe('Updated description with more details');
        expect(result.organization.website).toBe(updateData.website);
        expect(result.organization.contactEmail).toBe(updateData.contactEmail);
      }
    });

    test('should handle partial updates', async () => {
      const orgs = await organizationConcept._getByDomain({ 
        domain: `original-${testId}.edu` 
      });
      const orgId = orgs[0].organization;

      const updateData = {
        organization: orgId,
        name: 'Only Name Updated'
      };

      const result = await organizationConcept.update(updateData);

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.name).toBe('Only Name Updated');
        expect(result.organization.description).toBe('Original description'); // Should remain unchanged
      }
    });
  });

  describe('verification', () => {
    beforeEach(async () => {
      await organizationConcept.create({
        name: 'Verification Test Org',
        description: 'Organization for verification testing',
        type: 'education',
        domain: `verification-${testId}.edu`,
        contactEmail: `verify@verification-${testId}.edu`
      });
    });

    test('should verify organization', async () => {
      const orgs = await organizationConcept._getByDomain({ 
        domain: `verification-${testId}.edu` 
      });
      const orgId = orgs[0].organization;

      const result = await organizationConcept.verify({ organization: orgId });

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.isVerified).toBe(true);
        expect(result.organization.verifiedAt).toBeDefined();
      }
    });

    test('should unverify organization', async () => {
      const orgs = await organizationConcept._getByDomain({ 
        domain: `verification-${testId}.edu` 
      });
      const orgId = orgs[0].organization;

      // First verify
      await organizationConcept.verify({ organization: orgId });

      // Then unverify
      const result = await organizationConcept.unverify({ organization: orgId });

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.isVerified).toBe(false);
        expect(result.organization.verifiedAt).toBeNull();
      }
    });
  });

  describe('activate and deactivate', () => {
    beforeEach(async () => {
      await organizationConcept.create({
        name: 'Activation Test Org',
        description: 'Organization for activation testing',
        type: 'industry',
        domain: `activation-${testId}.com`,
        contactEmail: `activate@activation-${testId}.com`
      });
    });

    test('should deactivate organization', async () => {
      const orgs = await organizationConcept._getByDomain({ 
        domain: `activation-${testId}.com` 
      });
      const orgId = orgs[0].organization;

      const result = await organizationConcept.deactivate({ organization: orgId });

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.isActive).toBe(false);
      }
    });

    test('should reactivate organization', async () => {
      const orgs = await organizationConcept._getByDomain({ 
        domain: `activation-${testId}.com` 
      });
      const orgId = orgs[0].organization;

      // First deactivate
      await organizationConcept.deactivate({ organization: orgId });

      // Then reactivate
      const result = await organizationConcept.activate({ organization: orgId });

      expect(result).toHaveProperty('organization');
      if ('organization' in result) {
        expect(result.organization.isActive).toBe(true);
      }
    });
  });

  describe('hierarchical relationships', () => {
    test('should create organization with managing organization', async () => {
      // Create parent organization
      const parentResult = await organizationConcept.create({
        name: 'Parent University',
        description: 'Main university campus',
        type: 'education',
        domain: `parent-university-${testId}.edu`,
        contactEmail: `admin@parent-university-${testId}.edu`
      });

      expect(parentResult).toHaveProperty('organization');

      const parentOrgs = await organizationConcept._getByDomain({ 
        domain: `parent-university-${testId}.edu` 
      });
      const parentId = parentOrgs[0].id;

      // Create child organization
      const childResult = await organizationConcept.create({
        name: 'Satellite Campus',
        description: 'Satellite campus of parent university',
        managingOrganizationId: parentId,
        type: 'education',
        domain: `satellite-${testId}.edu`,
        contactEmail: `admin@satellite-${testId}.edu`
      });

      expect(childResult).toHaveProperty('organization');
      if ('organization' in childResult) {
        expect(childResult.organization.managingOrganizationId).toBe(parentId);
      }
    });

    test('should reject invalid managing organization', async () => {
      const invalidResult = await organizationConcept.create({
        name: 'Invalid Child Org',
        description: 'Organization with invalid parent',
        managingOrganizationId: 'non-existent-id',
        type: 'education',
        domain: `invalid-child-${testId}.edu`,
        contactEmail: `admin@invalid-child-${testId}.edu`
      });

      expect(invalidResult).toHaveProperty('error');
      if ('error' in invalidResult) {
        expect(invalidResult.error).toContain('Managing organization');
      }
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test organizations
      const orgs = [
        {
          name: 'Tech University',
          description: 'Technology-focused university',
          type: 'education',
          domain: `tech-university-${testId}.edu`,
          contactEmail: `admin@tech-university-${testId}.edu`
        },
        {
          name: 'Software Solutions Inc',
          description: 'Software development company',
          type: 'industry',
          domain: `software-solutions-${testId}.com`,
          contactEmail: `contact@software-solutions-${testId}.com`
        },
        {
          name: 'Innovation Department',
          description: 'Government innovation agency',
          type: 'government',
          domain: `innovation-${testId}.gov`,
          contactEmail: `info@innovation-${testId}.gov`
        },
        {
          name: 'Education Foundation',
          description: 'Nonprofit education foundation',
          type: 'nonprofit',
          domain: `education-foundation-${testId}.org`,
          contactEmail: `contact@education-foundation-${testId}.org`
        }
      ];

      for (const orgData of orgs) {
        await organizationConcept.create(orgData);
      }

      // Verify some organizations
      const techUniv = await organizationConcept._getByDomain({ 
        domain: `tech-university-${testId}.edu` 
      });
      await organizationConcept.verify({ organization: techUniv[0].organization });

      const softwareCorp = await organizationConcept._getByDomain({ 
        domain: `software-solutions-${testId}.com` 
      });
      await organizationConcept.verify({ organization: softwareCorp[0].organization });
    });

    test('should query organizations by type', async () => {
      const educationOrgs = await organizationConcept._getByType({ type: 'education' });
      const industryOrgs = await organizationConcept._getByType({ type: 'industry' });
      const governmentOrgs = await organizationConcept._getByType({ type: 'government' });
      const nonprofitOrgs = await organizationConcept._getByType({ type: 'nonprofit' });

      expect(educationOrgs.length).toBeGreaterThanOrEqual(1);
      expect(industryOrgs.length).toBeGreaterThanOrEqual(1);
      expect(governmentOrgs.length).toBeGreaterThanOrEqual(1);
      expect(nonprofitOrgs.length).toBeGreaterThanOrEqual(1);

      expect(educationOrgs.every(org => org.organizationType === 'education')).toBe(true);
      expect(industryOrgs.every(org => org.organizationType === 'industry')).toBe(true);
      expect(governmentOrgs.every(org => org.organizationType === 'government')).toBe(true);
      expect(nonprofitOrgs.every(org => org.organizationType === 'nonprofit')).toBe(true);
    });

    test('should query organizations by domain', async () => {
      const techUnivOrgs = await organizationConcept._getByDomain({ 
        domain: `tech-university-${testId}.edu` 
      });

      expect(techUnivOrgs).toHaveLength(1);
      expect(techUnivOrgs[0].name).toBe('Tech University');
    });

    test('should get active organizations', async () => {
      const activeOrgs = await organizationConcept._getActive();

      expect(activeOrgs.length).toBeGreaterThanOrEqual(4);
      expect(activeOrgs.every(org => org.isActive)).toBe(true);
    });

    test('should get verified organizations', async () => {
      const verifiedOrgs = await organizationConcept._getVerified();

      expect(verifiedOrgs.length).toBeGreaterThanOrEqual(2);
      expect(verifiedOrgs.every(org => org.isVerified)).toBe(true);
    });

    test('should search organizations by keywords', async () => {
      const techSearch = await organizationConcept._searchByKeywords({ 
        keywords: ['technology', 'tech'] 
      });

      expect(techSearch.length).toBeGreaterThanOrEqual(1);
      expect(techSearch.some(org => org.name.includes('Tech'))).toBe(true);

      const educationSearch = await organizationConcept._searchByKeywords({ 
        keywords: ['education', 'university'] 
      });

      expect(educationSearch.length).toBeGreaterThanOrEqual(2);
      expect(educationSearch.some(org => 
        org.name.includes('University') || org.description.includes('education')
      )).toBe(true);
    });

    test('should get organizations by status combination', async () => {
      // Deactivate one organization
      const softwareOrgs = await organizationConcept._getByDomain({ 
        domain: `software-solutions-${testId}.com` 
      });
      await organizationConcept.deactivate({ organization: softwareOrgs[0].organization });

      // Query active + verified
      const activeVerifiedOrgs = await organizationConcept._getActiveVerified();

      expect(activeVerifiedOrgs.length).toBeGreaterThanOrEqual(1);
      expect(activeVerifiedOrgs.every(org => org.isActive && org.isVerified)).toBe(true);
    });
  });

  describe('organization metrics and statistics', () => {
    beforeEach(async () => {
      // Create organizations for metrics testing
      await organizationConcept.create({
        name: 'Metrics Test University',
        description: 'University for testing metrics',
        type: 'education',
        domain: `metrics-university-${testId}.edu`,
        contactEmail: `admin@metrics-university-${testId}.edu`
      });

      await organizationConcept.create({
        name: 'Metrics Test Corp',
        description: 'Corporation for testing metrics',
        type: 'industry',
        domain: `metrics-corp-${testId}.com`,
        contactEmail: `contact@metrics-corp-${testId}.com`
      });
    });

    test('should get organization count by type', async () => {
      const typeCounts = await organizationConcept._getCountByType();

      expect(typeCounts.length).toBeGreaterThanOrEqual(2);
      
      const educationCount = typeCounts.find(tc => tc.type === 'education');
      const industryCount = typeCounts.find(tc => tc.type === 'industry');

      expect(educationCount?.count).toBeGreaterThanOrEqual(1);
      expect(industryCount?.count).toBeGreaterThanOrEqual(1);
    });

    test('should get recently created organizations', async () => {
      const recentOrgs = await organizationConcept._getRecentlyCreated({ limit: 5 });

      expect(recentOrgs.length).toBeGreaterThanOrEqual(2);
      
      // Should be ordered by creation date (most recent first)
      for (let i = 0; i < recentOrgs.length - 1; i++) {
        expect(recentOrgs[i].createdAt.getTime())
          .toBeGreaterThanOrEqual(recentOrgs[i + 1].createdAt.getTime());
      }
    });
  });

  describe('delete and cleanup', () => {
    beforeEach(async () => {
      await organizationConcept.create({
        name: 'Delete Test Organization',
        description: 'Organization for deletion testing',
        type: 'education',
        domain: `delete-test-${testId}.edu`,
        contactEmail: `admin@delete-test-${testId}.edu`
      });
    });

    test('should soft delete organization', async () => {
      const orgs = await organizationConcept._getByDomain({ 
        domain: `delete-test-${testId}.edu` 
      });
      const orgId = orgs[0].organization;

      const result = await organizationConcept.delete({ organization: orgId });

      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
      }

      // Verify organization is deactivated (soft delete)
      const deletedOrgs = await organizationConcept._getByDomain({ 
        domain: `delete-test-${testId}.edu` 
      });
      expect(deletedOrgs).toHaveLength(1);
      expect(deletedOrgs[0].isActive).toBe(false);
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle operations on non-existent organization', async () => {
      const nonExistentId = 'non-existent-org';

      const updateResult = await organizationConcept.update({
        organization: nonExistentId,
        name: 'Should Fail'
      });
      expect(updateResult).toHaveProperty('error');

      const verifyResult = await organizationConcept.verify({
        organization: nonExistentId
      });
      expect(verifyResult).toHaveProperty('error');

      const activateResult = await organizationConcept.activate({
        organization: nonExistentId
      });
      expect(activateResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidOrgData = {
        name: '', // Empty name
        description: 'Valid description',
        type: 'education',
        domain: `invalid-${testId}.edu`,
        contactEmail: `invalid@invalid-${testId}.edu`
      };

      const result = await organizationConcept.create(invalidOrgData);
      expect(result).toHaveProperty('error');
    });

    test('should validate email format', async () => {
      const invalidEmailData = {
        name: 'Valid Organization',
        description: 'Valid description',
        type: 'education',
        domain: `valid-org-${testId}.edu`,
        contactEmail: 'invalid-email-format'
      };

      const result = await organizationConcept.create(invalidEmailData);
      expect(result).toHaveProperty('error');
    });

    test('should validate domain format', async () => {
      const invalidDomainData = {
        name: 'Valid Organization',
        description: 'Valid description',
        type: 'education',
        domain: 'invalid domain with spaces',
        contactEmail: `valid@email-${testId}.com`
      };

      const result = await organizationConcept.create(invalidDomainData);
      expect(result).toHaveProperty('error');
    });
  });
});
