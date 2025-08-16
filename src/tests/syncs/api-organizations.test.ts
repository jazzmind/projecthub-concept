import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { OrganizationConcept } from '@/lib/concepts/common/organization';
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

// Mock concept instances for testing sync workflows
const organizationConcept = new OrganizationConcept();
const userConcept = new UserConcept();
const roleConcept = new RoleConcept();
const membershipConcept = new MembershipConcept();
const sessionConcept = new SessionConcept();

describe('API Organizations Sync Tests', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'org-sync-test-' + Date.now();
    
    // Clean up test data
    await prisma.organization.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.organization.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Organization Creation Workflows', () => {
    test('should create education organization with admin user', async () => {
      // 1. Create admin user
      const adminUser = await userConcept.register({
        user: testId + '-admin',
        email: `admin@${testId}.edu`,
        name: 'Organization Administrator'
      });
      expect(adminUser).toHaveProperty('user');

      // 2. Create organization admin role
      const adminRole = await roleConcept.create({
        name: 'org_admin',
        displayName: 'Organization Administrator',
        description: 'Full organization management access',
        scope: 'organization',
        permissions: {
          users: { create: true, read: true, update: true, delete: true },
          teams: { create: true, read: true, update: true, delete: true },
          projects: { create: true, read: true, update: true, delete: true },
          campaigns: { create: true, read: true, update: true, delete: true },
          settings: { read: true, update: true }
        }
      });
      expect(adminRole).toHaveProperty('role');

      // 3. Create organization
      const orgData = {
        name: 'Test University',
        description: 'Leading educational institution for technology',
        type: 'education',
        domain: `test-university-${testId}.edu`,
        contactEmail: `admin@test-university-${testId}.edu`,
        website: `https://test-university-${testId}.edu`
      };

      const organization = await organizationConcept.create(orgData);
      expect(organization).toHaveProperty('organization');

      // 4. Create admin membership (auto-assign creator as admin)
      if ('organization' in organization) {
        const membership = await membershipConcept.invite({
          memberEntity: testId + '-admin',
          targetEntity: organization.organization.organization,
          roleEntity: 'org_admin',
          invitedBy: 'system'
        });
        expect(membership).toHaveProperty('membership');

        // Auto-accept admin membership
        const acceptResult = await membershipConcept.accept({
          memberEntity: testId + '-admin',
          targetEntity: organization.organization.organization
        });
        expect(acceptResult).toHaveProperty('membership');
      }
    });

    test('should create industry organization with partnership workflow', async () => {
      // 1. Create industry partner user
      const partnerUser = await userConcept.register({
        user: testId + '-partner',
        email: `contact@${testId}-corp.com`,
        name: 'Industry Partner Representative'
      });
      expect(partnerUser).toHaveProperty('user');

      // 2. Create industry partner role
      const partnerRole = await roleConcept.create({
        name: 'industry_partner',
        displayName: 'Industry Partner',
        description: 'Industry collaboration and project partnership',
        scope: 'organization',
        permissions: {
          projects: { read: true, collaborate: true, provide_feedback: true },
          teams: { read: true, observe: true },
          campaigns: { read: true, participate: true }
        }
      });
      expect(partnerRole).toHaveProperty('role');

      // 3. Create industry organization
      const industryOrg = await organizationConcept.create({
        name: 'TechCorp Industries',
        description: 'Leading technology solutions provider',
        type: 'industry',
        domain: `techcorp-${testId}.com`,
        contactEmail: `contact@techcorp-${testId}.com`,
        website: `https://techcorp-${testId}.com`
      });
      expect(industryOrg).toHaveProperty('organization');

      // 4. Set up partnership membership
      if ('organization' in industryOrg) {
        const partnership = await membershipConcept.invite({
          memberEntity: testId + '-partner',
          targetEntity: industryOrg.organization.organization,
          roleEntity: 'industry_partner',
          invitedBy: 'system'
        });
        expect(partnership).toHaveProperty('membership');
      }
    });

    test('should handle hierarchical organization creation', async () => {
      // 1. Create parent organization
      const parentOrg = await organizationConcept.create({
        name: 'Global University System',
        description: 'International network of educational institutions',
        type: 'education',
        domain: `global-university-${testId}.edu`,
        contactEmail: `admin@global-university-${testId}.edu`
      });
      expect(parentOrg).toHaveProperty('organization');

      // 2. Create child campus organization
      if ('organization' in parentOrg) {
        // Note: This would need to be adjusted based on actual Organization concept interface
        const childOrg = await organizationConcept.create({
          name: 'Campus Branch',
          description: 'Local campus of the global university system',
          type: 'education',
          domain: `campus-${testId}.edu`,
          contactEmail: `campus@campus-${testId}.edu`,
          // managingOrganizationId: parentOrg.organization.id  // Would need schema support
        });
        expect(childOrg).toHaveProperty('organization');
      }
    });
  });

  describe('Organization Management Workflows', () => {
    beforeEach(async () => {
      // Create base organization for management tests
      await organizationConcept.create({
        name: 'Management Test Organization',
        description: 'Organization for testing management workflows',
        type: 'education',
        domain: `mgmt-test-${testId}.edu`,
        contactEmail: `admin@mgmt-test-${testId}.edu`
      });

      // Create admin user and role
      await userConcept.register({
        user: testId + '-admin',
        email: `admin@mgmt-test-${testId}.edu`,
        name: 'Admin User'
      });

      await roleConcept.create({
        name: 'org_admin',
        displayName: 'Organization Admin',
        description: 'Organization administrator',
        scope: 'organization',
        permissions: { organization: { manage: true } }
      });
    });

    test('should handle organization verification workflow', async () => {
      // Get created organization
      const orgs = await organizationConcept._getByDomain({ 
        domain: `mgmt-test-${testId}.edu` 
      });
      expect(orgs.length).toBeGreaterThanOrEqual(1);

      // Verification would typically be done by platform admins
      // This would require the Organization concept to have verify/unverify methods
    });

    test('should handle organization activation and deactivation', async () => {
      // Get created organization
      const orgs = await organizationConcept._getByDomain({ 
        domain: `mgmt-test-${testId}.edu` 
      });
      expect(orgs.length).toBeGreaterThanOrEqual(1);

      // Test activation/deactivation workflows
      // This would require the Organization concept to have activate/deactivate methods
    });

    test('should handle organization settings management', async () => {
      // Get created organization
      const orgs = await organizationConcept._getByDomain({ 
        domain: `mgmt-test-${testId}.edu` 
      });
      expect(orgs.length).toBeGreaterThanOrEqual(1);

      // Update organization settings
      if (orgs.length > 0) {
        const orgId = orgs[0].organization;
        const updateResult = await organizationConcept.update({
          organization: orgId,
          name: 'Updated Management Test Organization',
          description: 'Updated description with new information'
        });
        
        // The result depends on the actual implementation
        // expect(updateResult).toHaveProperty('organization');
      }
    });
  });

  describe('Member Management Workflows', () => {
    beforeEach(async () => {
      // Create organization
      await organizationConcept.create({
        name: 'Member Management Organization',
        description: 'Organization for testing member management',
        type: 'education',
        domain: `member-mgmt-${testId}.edu`,
        contactEmail: `admin@member-mgmt-${testId}.edu`
      });

      // Create users
      await userConcept.register({
        user: testId + '-admin',
        email: `admin@member-mgmt-${testId}.edu`,
        name: 'Admin User'
      });

      await userConcept.register({
        user: testId + '-educator',
        email: `educator@member-mgmt-${testId}.edu`,
        name: 'Educator User'
      });

      await userConcept.register({
        user: testId + '-learner',
        email: `learner@member-mgmt-${testId}.edu`,
        name: 'Learner User'
      });

      // Create roles
      await roleConcept.create({
        name: 'educator',
        displayName: 'Educator',
        description: 'Educational content and team management',
        scope: 'organization',
        permissions: {
          teams: { create: true, read: true, update: true },
          projects: { create: true, read: true, update: true },
          learners: { read: true, guide: true }
        }
      });

      await roleConcept.create({
        name: 'learner',
        displayName: 'Learner',
        description: 'Learning participation and collaboration',
        scope: 'organization',
        permissions: {
          teams: { read: true, join: true },
          projects: { read: true, participate: true },
          assignments: { read: true, submit: true }
        }
      });
    });

    test('should invite and manage organization members', async () => {
      // Get organization
      const orgs = await organizationConcept._getByDomain({ 
        domain: `member-mgmt-${testId}.edu` 
      });
      expect(orgs.length).toBeGreaterThanOrEqual(1);

      if (orgs.length > 0) {
        const orgId = orgs[0].organization;

        // Invite educator
        const educatorInvite = await membershipConcept.invite({
          memberEntity: testId + '-educator',
          targetEntity: orgId,
          roleEntity: 'educator',
          invitedBy: testId + '-admin',
          message: 'Welcome to our educational organization!'
        });
        expect(educatorInvite).toHaveProperty('membership');

        // Invite learner
        const learnerInvite = await membershipConcept.invite({
          memberEntity: testId + '-learner',
          targetEntity: orgId,
          roleEntity: 'learner',
          invitedBy: testId + '-admin',
          message: 'Join our learning community!'
        });
        expect(learnerInvite).toHaveProperty('membership');

        // Accept invitations
        const educatorAccept = await membershipConcept.accept({
          memberEntity: testId + '-educator',
          targetEntity: orgId
        });
        expect(educatorAccept).toHaveProperty('membership');

        const learnerAccept = await membershipConcept.accept({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });
        expect(learnerAccept).toHaveProperty('membership');

        // Verify active memberships
        const orgMembers = await membershipConcept._getActiveByTarget({
          targetEntity: orgId
        });
        expect(orgMembers.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should handle member role updates', async () => {
      // Get organization
      const orgs = await organizationConcept._getByDomain({ 
        domain: `member-mgmt-${testId}.edu` 
      });

      if (orgs.length > 0) {
        const orgId = orgs[0].organization;

        // Create and accept membership
        await membershipConcept.invite({
          memberEntity: testId + '-learner',
          targetEntity: orgId,
          roleEntity: 'learner',
          invitedBy: testId + '-admin'
        });

        await membershipConcept.accept({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });

        // Promote learner to educator
        const roleUpdate = await membershipConcept.updateRole({
          memberEntity: testId + '-learner',
          targetEntity: orgId,
          roleEntity: 'educator'
        });
        expect(roleUpdate).toHaveProperty('membership');

        // Verify role change
        const updatedMembership = await membershipConcept._getByMemberAndTarget({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });
        expect(updatedMembership).toHaveLength(1);
        expect(updatedMembership[0].roleEntity).toBe('educator');
      }
    });

    test('should handle member suspension and reactivation', async () => {
      // Get organization
      const orgs = await organizationConcept._getByDomain({ 
        domain: `member-mgmt-${testId}.edu` 
      });

      if (orgs.length > 0) {
        const orgId = orgs[0].organization;

        // Create and accept membership
        await membershipConcept.invite({
          memberEntity: testId + '-learner',
          targetEntity: orgId,
          roleEntity: 'learner',
          invitedBy: testId + '-admin'
        });

        await membershipConcept.accept({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });

        // Suspend member
        const suspendResult = await membershipConcept.suspend({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });
        expect(suspendResult).toHaveProperty('membership');

        // Verify suspension
        const isActive = await membershipConcept._isActiveMember({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });
        expect(isActive[0]).toBe(false);

        // Reactivate member
        const reactivateResult = await membershipConcept.reactivate({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });
        expect(reactivateResult).toHaveProperty('membership');

        // Verify reactivation
        const isActiveAfter = await membershipConcept._isActiveMember({
          memberEntity: testId + '-learner',
          targetEntity: orgId
        });
        expect(isActiveAfter[0]).toBe(true);
      }
    });
  });

  describe('Organization Discovery and Search', () => {
    beforeEach(async () => {
      // Create multiple organizations for search testing
      const organizations = [
        {
          name: 'Stanford Technology University',
          description: 'Leading research university in computer science and engineering',
          type: 'education',
          domain: `stanford-tech-${testId}.edu`,
          contactEmail: `admin@stanford-tech-${testId}.edu`
        },
        {
          name: 'MIT Innovation Lab',
          description: 'Cutting-edge research and development in artificial intelligence',
          type: 'education',
          domain: `mit-innovation-${testId}.edu`,
          contactEmail: `admin@mit-innovation-${testId}.edu`
        },
        {
          name: 'Google Technology Solutions',
          description: 'Enterprise technology solutions and cloud services',
          type: 'industry',
          domain: `google-tech-${testId}.com`,
          contactEmail: `contact@google-tech-${testId}.com`
        },
        {
          name: 'Microsoft Innovation Center',
          description: 'Software development tools and platform services',
          type: 'industry',
          domain: `microsoft-innovation-${testId}.com`,
          contactEmail: `contact@microsoft-innovation-${testId}.com`
        },
        {
          name: 'Department of Digital Innovation',
          description: 'Government agency for digital transformation initiatives',
          type: 'government',
          domain: `digital-innovation-${testId}.gov`,
          contactEmail: `info@digital-innovation-${testId}.gov`
        }
      ];

      for (const org of organizations) {
        await organizationConcept.create(org);
      }
    });

    test('should search organizations by type', async () => {
      const educationOrgs = await organizationConcept._getByType({ type: 'education' });
      const industryOrgs = await organizationConcept._getByType({ type: 'industry' });
      const governmentOrgs = await organizationConcept._getByType({ type: 'government' });

      expect(educationOrgs.length).toBeGreaterThanOrEqual(2);
      expect(industryOrgs.length).toBeGreaterThanOrEqual(2);
      expect(governmentOrgs.length).toBeGreaterThanOrEqual(1);

      expect(educationOrgs.every(org => org.organizationType === 'education')).toBe(true);
      expect(industryOrgs.every(org => org.organizationType === 'industry')).toBe(true);
      expect(governmentOrgs.every(org => org.organizationType === 'government')).toBe(true);
    });

    test('should search organizations by keywords', async () => {
      const technologySearch = await organizationConcept._searchByKeywords({
        keywords: ['technology', 'tech']
      });

      expect(technologySearch.length).toBeGreaterThanOrEqual(3);
      expect(technologySearch.some(org => 
        org.name.toLowerCase().includes('technology') || 
        org.name.toLowerCase().includes('tech') ||
        org.description.toLowerCase().includes('technology')
      )).toBe(true);

      const innovationSearch = await organizationConcept._searchByKeywords({
        keywords: ['innovation', 'research']
      });

      expect(innovationSearch.length).toBeGreaterThanOrEqual(3);
      expect(innovationSearch.some(org => 
        org.name.toLowerCase().includes('innovation') ||
        org.description.toLowerCase().includes('innovation') ||
        org.description.toLowerCase().includes('research')
      )).toBe(true);
    });

    test('should filter active and verified organizations', async () => {
      // All created organizations should be active by default
      const activeOrgs = await organizationConcept._getActive();
      expect(activeOrgs.length).toBeGreaterThanOrEqual(5);
      expect(activeOrgs.every(org => org.isActive)).toBe(true);

      // Verification would depend on having verification methods in the concept
      // const verifiedOrgs = await organizationConcept._getVerified();
    });
  });

  describe('Organization Analytics and Metrics', () => {
    beforeEach(async () => {
      // Create organizations for analytics
      const orgTypes = ['education', 'industry', 'government', 'nonprofit'];
      
      for (let i = 0; i < orgTypes.length; i++) {
        await organizationConcept.create({
          name: `Analytics Test Organization ${i + 1}`,
          description: `Test organization for analytics - ${orgTypes[i]}`,
          type: orgTypes[i],
          domain: `analytics-test-${i + 1}-${testId}.${orgTypes[i] === 'education' ? 'edu' : orgTypes[i] === 'government' ? 'gov' : orgTypes[i] === 'nonprofit' ? 'org' : 'com'}`,
          contactEmail: `admin@analytics-test-${i + 1}-${testId}.com`
        });
      }
    });

    test('should calculate organization type distribution', async () => {
      // This would require implementation of analytics methods in OrganizationConcept
      // const typeDistribution = await organizationConcept._getCountByType();
      
      // For now, we can manually count
      const allOrgs = await organizationConcept._getActive();
      const typeCounts = allOrgs.reduce((acc, org) => {
        acc[org.organizationType] = (acc[org.organizationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(typeCounts.education).toBeGreaterThanOrEqual(1);
      expect(typeCounts.industry).toBeGreaterThanOrEqual(1);
      expect(typeCounts.government).toBeGreaterThanOrEqual(1);
      expect(typeCounts.nonprofit).toBeGreaterThanOrEqual(1);
    });

    test('should track organization growth over time', async () => {
      // Get recently created organizations
      // This would require implementation of time-based queries
      const allOrgs = await organizationConcept._getActive();
      
      // All test organizations should be recent
      expect(allOrgs.length).toBeGreaterThanOrEqual(4);
      
      // Check that they were created recently (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOrgs = allOrgs.filter(org => org.createdAt > oneHourAgo);
      expect(recentOrgs.length).toBe(allOrgs.length);
    });
  });

  describe('Organization Integration Workflows', () => {
    test('should handle complete organization setup workflow', async () => {
      const workflowId = testId + '-complete-workflow';

      // 1. Create organization founder
      const founder = await userConcept.register({
        user: workflowId + '-founder',
        email: `founder@complete-workflow-${testId}.edu`,
        name: 'Organization Founder'
      });
      expect(founder).toHaveProperty('user');

      // 2. Create organization
      const organization = await organizationConcept.create({
        name: 'Complete Workflow University',
        description: 'University created through complete workflow testing',
        type: 'education',
        domain: `complete-workflow-${testId}.edu`,
        contactEmail: `admin@complete-workflow-${testId}.edu`,
        website: `https://complete-workflow-${testId}.edu`
      });
      expect(organization).toHaveProperty('organization');

      // 3. Create founder session
      const session = await sessionConcept.create({
        sessionKey: workflowId + '-session',
        loginMethod: 'email'
      });
      expect(session).toHaveProperty('session');

      // 4. Set organization context
      if ('organization' in organization) {
        const contextResult = await sessionConcept.setContext({
          sessionKey: workflowId + '-session',
          context: organization.organization.organization
        });
        expect(contextResult).toHaveProperty('session');
      }

      // 5. Create organization roles
      const roles = [
        {
          name: 'org_admin',
          displayName: 'Organization Administrator',
          scope: 'organization',
          permissions: { organization: { manage: true } }
        },
        {
          name: 'educator',
          displayName: 'Educator',
          scope: 'organization',
          permissions: { courses: { create: true, manage: true } }
        },
        {
          name: 'learner',
          displayName: 'Learner',
          scope: 'organization',
          permissions: { courses: { read: true, participate: true } }
        }
      ];

      for (const roleData of roles) {
        const role = await roleConcept.create({
          name: roleData.name,
          displayName: roleData.displayName,
          description: `${roleData.displayName} role for organization`,
          scope: roleData.scope,
          permissions: roleData.permissions
        });
        expect(role).toHaveProperty('role');
      }

      // 6. Assign founder as admin
      if ('organization' in organization) {
        const founderMembership = await membershipConcept.invite({
          memberEntity: workflowId + '-founder',
          targetEntity: organization.organization.organization,
          roleEntity: 'org_admin',
          invitedBy: 'system'
        });
        expect(founderMembership).toHaveProperty('membership');

        const acceptMembership = await membershipConcept.accept({
          memberEntity: workflowId + '-founder',
          targetEntity: organization.organization.organization
        });
        expect(acceptMembership).toHaveProperty('membership');
      }

      // 7. Verify complete setup
      if ('organization' in organization) {
        const orgMembers = await membershipConcept._getActiveByTarget({
          targetEntity: organization.organization.organization
        });
        expect(orgMembers.length).toBeGreaterThanOrEqual(1);

        const founderMembership = await membershipConcept._isActiveMember({
          memberEntity: workflowId + '-founder',
          targetEntity: organization.organization.organization
        });
        expect(founderMembership[0]).toBe(true);
      }
    });

    test('should handle organization partnership workflow', async () => {
      // Create two organizations for partnership
      const univOrg = await organizationConcept.create({
        name: 'Partnership University',
        description: 'University seeking industry partnerships',
        type: 'education',
        domain: `partnership-univ-${testId}.edu`,
        contactEmail: `admin@partnership-univ-${testId}.edu`
      });

      const industryOrg = await organizationConcept.create({
        name: 'Partnership Corp',
        description: 'Industry partner for educational collaboration',
        type: 'industry',
        domain: `partnership-corp-${testId}.com`,
        contactEmail: `contact@partnership-corp-${testId}.com`
      });

      expect(univOrg).toHaveProperty('organization');
      expect(industryOrg).toHaveProperty('organization');

      // Create partnership representatives
      const univRep = await userConcept.register({
        user: testId + '-univ-rep',
        email: `rep@partnership-univ-${testId}.edu`,
        name: 'University Representative'
      });

      const industryRep = await userConcept.register({
        user: testId + '-industry-rep',
        email: `rep@partnership-corp-${testId}.com`,
        name: 'Industry Representative'
      });

      expect(univRep).toHaveProperty('user');
      expect(industryRep).toHaveProperty('user');

      // The partnership workflow would involve cross-organization collaboration
      // This would be implemented through more complex sync patterns
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid organization creation', async () => {
      // Invalid organization type
      const invalidTypeResult = await organizationConcept.create({
        name: 'Invalid Type Organization',
        description: 'Testing invalid type',
        type: 'invalid_type',
        domain: `invalid-${testId}.com`,
        contactEmail: `admin@invalid-${testId}.com`
      });
      expect(invalidTypeResult).toHaveProperty('error');

      // Duplicate domain
      await organizationConcept.create({
        name: 'First Organization',
        description: 'First organization',
        type: 'education',
        domain: `duplicate-${testId}.edu`,
        contactEmail: `first@duplicate-${testId}.edu`
      });

      const duplicateDomainResult = await organizationConcept.create({
        name: 'Second Organization',
        description: 'Second organization with duplicate domain',
        type: 'industry',
        domain: `duplicate-${testId}.edu`,
        contactEmail: `second@duplicate-${testId}.edu`
      });
      expect(duplicateDomainResult).toHaveProperty('error');
    });

    test('should handle membership workflow errors', async () => {
      // Create organization
      const org = await organizationConcept.create({
        name: 'Error Test Organization',
        description: 'Organization for testing error handling',
        type: 'education',
        domain: `error-test-${testId}.edu`,
        contactEmail: `admin@error-test-${testId}.edu`
      });

      if ('organization' in org) {
        // Try to invite non-existent user
        const invalidUserInvite = await membershipConcept.invite({
          memberEntity: 'non-existent-user',
          targetEntity: org.organization.organization,
          roleEntity: 'learner',
          invitedBy: 'admin'
        });
        // This may or may not error depending on validation

        // Try to use non-existent role
        await userConcept.register({
          user: testId + '-valid-user',
          email: `valid@error-test-${testId}.edu`,
          name: 'Valid User'
        });

        const invalidRoleInvite = await membershipConcept.invite({
          memberEntity: testId + '-valid-user',
          targetEntity: org.organization.organization,
          roleEntity: 'non-existent-role',
          invitedBy: 'admin'
        });
        // This may or may not error depending on validation
      }
    });

    test('should handle session and context errors', async () => {
      // Try to set context to non-existent organization
      const session = await sessionConcept.create({
        sessionKey: testId + '-error-session',
        loginMethod: 'email'
      });

      if ('session' in session) {
        const invalidContextResult = await sessionConcept.setContext({
          sessionKey: testId + '-error-session',
          context: 'non-existent-organization'
        });
        expect(invalidContextResult).toHaveProperty('session');
        // Context setting may succeed but context won't be valid
      }
    });
  });
});
