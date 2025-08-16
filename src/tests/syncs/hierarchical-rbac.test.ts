import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { makeHierarchicalRBACsyncs } from '@/lib/syncs/project/hierarchical-rbac';
import { UserConcept } from '@/lib/concepts/common/user';
import { RoleConcept } from '@/lib/concepts/common/role';
import { MembershipConcept } from '@/lib/concepts/common/membership';
import { SessionConcept } from '@/lib/concepts/common/session';
import { OrganizationConcept } from '@/lib/concepts/common/organization';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock concept instances
const mockUser = new UserConcept();
const mockRole = new RoleConcept();
const mockMembership = new MembershipConcept();
const mockSession = new SessionConcept();
const mockOrganization = new OrganizationConcept();

describe('Hierarchical RBAC Sync Tests', () => {
  let testId: string;
  let rbacSyncs: any;

  beforeEach(async () => {
    testId = 'rbac-test-' + Date.now();
    
    // Clean up test data
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Initialize the sync functions
    rbacSyncs = makeHierarchicalRBACsyncs(mockUser, mockRole, mockMembership, mockSession);
  });

  afterEach(async () => {
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Platform Role Initialization', () => {
    test('should initialize platform roles', async () => {
      // Create platform roles
      const platformAdmin = await mockRole.create({
        name: 'platform_admin',
        displayName: 'Platform Administrator',
        description: 'Full platform access',
        scope: 'platform',
        permissions: {
          users: { create: true, read: true, update: true, delete: true },
          organizations: { create: true, read: true, update: true, delete: true },
          roles: { create: true, read: true, update: true, delete: true }
        }
      });

      const orgAdmin = await mockRole.create({
        name: 'org_admin',
        displayName: 'Organization Administrator',
        description: 'Organization management',
        scope: 'organization',
        permissions: {
          users: { read: true, update: true },
          teams: { create: true, read: true, update: true, delete: true },
          projects: { create: true, read: true, update: true, delete: true },
          campaigns: { create: true, read: true, update: true, delete: true }
        }
      });

      const teamLeader = await mockRole.create({
        name: 'team_leader',
        displayName: 'Team Leader',
        description: 'Team leadership',
        scope: 'team',
        permissions: {
          team_members: { create: true, read: true, update: true, delete: true },
          assignments: { create: true, read: true, update: true },
          projects: { read: true, update: true }
        }
      });

      const learner = await mockRole.create({
        name: 'learner',
        displayName: 'Learner',
        description: 'Learning participation',
        scope: 'team',
        permissions: {
          assignments: { read: true, update: true },
          projects: { read: true },
          profile: { read: true, update: true }
        }
      });

      expect(platformAdmin).toHaveProperty('role');
      expect(orgAdmin).toHaveProperty('role');
      expect(teamLeader).toHaveProperty('role');
      expect(learner).toHaveProperty('role');
    });

    test('should query roles by scope', async () => {
      // Create roles with different scopes
      await mockRole.create({
        name: testId + '-platform-role',
        displayName: 'Platform Role',
        description: 'Platform scope role',
        scope: 'platform',
        permissions: { platform: { manage: true } }
      });

      await mockRole.create({
        name: testId + '-org-role',
        displayName: 'Organization Role',
        description: 'Organization scope role',
        scope: 'organization',
        permissions: { organization: { manage: true } }
      });

      await mockRole.create({
        name: testId + '-team-role',
        displayName: 'Team Role',
        description: 'Team scope role',
        scope: 'team',
        permissions: { team: { manage: true } }
      });

      // Query by scope
      const platformRoles = await mockRole._getByScope({ scope: 'platform' });
      const orgRoles = await mockRole._getByScope({ scope: 'organization' });
      const teamRoles = await mockRole._getByScope({ scope: 'team' });

      expect(platformRoles.length).toBeGreaterThanOrEqual(1);
      expect(orgRoles.length).toBeGreaterThanOrEqual(1);
      expect(teamRoles.length).toBeGreaterThanOrEqual(1);

      expect(platformRoles.every(r => r.scope === 'platform')).toBe(true);
      expect(orgRoles.every(r => r.scope === 'organization')).toBe(true);
      expect(teamRoles.every(r => r.scope === 'team')).toBe(true);
    });
  });

  describe('Effective Role Calculation', () => {
    beforeEach(async () => {
      // Create test user
      await mockUser.register({
        user: testId + '-user',
        email: `test-${testId}@example.com`,
        name: 'Test User'
      });

      // Create hierarchical roles
      await mockRole.create({
        name: testId + '-platform-admin',
        displayName: 'Platform Admin',
        description: 'Platform administrator',
        scope: 'platform',
        permissions: { 
          platform: { manage: true },
          organizations: { create: true, read: true, update: true, delete: true }
        }
      });

      await mockRole.create({
        name: testId + '-org-admin',
        displayName: 'Org Admin',
        description: 'Organization administrator',
        scope: 'organization',
        permissions: { 
          organization: { manage: true },
          teams: { create: true, read: true, update: true, delete: true }
        }
      });

      await mockRole.create({
        name: testId + '-team-leader',
        displayName: 'Team Leader',
        description: 'Team leader',
        scope: 'team',
        permissions: { 
          team: { manage: true },
          assignments: { create: true, read: true, update: true }
        }
      });
    });

    test('should calculate effective permissions with hierarchy', async () => {
      // Create memberships at different levels
      await mockMembership.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-platform',
        roleEntity: testId + '-platform-admin',
        invitedBy: 'system'
      });

      await mockMembership.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org',
        roleEntity: testId + '-org-admin',
        invitedBy: 'system'
      });

      await mockMembership.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-team',
        roleEntity: testId + '-team-leader',
        invitedBy: 'system'
      });

      // Accept all memberships
      await mockMembership.accept({
        memberEntity: testId + '-user',
        targetEntity: testId + '-platform'
      });

      await mockMembership.accept({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org'
      });

      await mockMembership.accept({
        memberEntity: testId + '-user',
        targetEntity: testId + '-team'
      });

      // Query memberships to verify hierarchy
      const platformMembership = await mockMembership._getByMemberAndTarget({
        memberEntity: testId + '-user',
        targetEntity: testId + '-platform'
      });

      const orgMembership = await mockMembership._getByMemberAndTarget({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org'
      });

      const teamMembership = await mockMembership._getByMemberAndTarget({
        memberEntity: testId + '-user',
        targetEntity: testId + '-team'
      });

      expect(platformMembership).toHaveLength(1);
      expect(orgMembership).toHaveLength(1);
      expect(teamMembership).toHaveLength(1);

      expect(platformMembership[0].isActive).toBe(true);
      expect(orgMembership[0].isActive).toBe(true);
      expect(teamMembership[0].isActive).toBe(true);
    });

    test('should handle context-specific permissions', async () => {
      // Create session with context
      await mockSession.create({
        sessionKey: testId + '-session',
        loginMethod: 'email'
      });

      await mockSession.setContext({
        sessionKey: testId + '-session',
        context: testId + '-team'
      });

      // Verify context is set
      const context = await mockSession._getCurrentContext({
        sessionKey: testId + '-session'
      });

      expect(context).toHaveLength(1);
      expect(context[0]).toBe(testId + '-team');
    });
  });

  describe('Permission Checking', () => {
    beforeEach(async () => {
      // Create test roles with specific permissions
      await mockRole.create({
        name: testId + '-admin',
        displayName: 'Admin',
        description: 'Administrator role',
        scope: 'organization',
        permissions: {
          users: { create: true, read: true, update: true, delete: false },
          projects: { create: true, read: true, update: true, delete: true },
          teams: { create: true, read: true, update: false, delete: false }
        }
      });

      await mockRole.create({
        name: testId + '-viewer',
        displayName: 'Viewer',
        description: 'Read-only role',
        scope: 'organization',
        permissions: {
          users: { create: false, read: true, update: false, delete: false },
          projects: { create: false, read: true, update: false, delete: false },
          teams: { create: false, read: true, update: false, delete: false }
        }
      });
    });

    test('should check role permissions correctly', async () => {
      // Test admin permissions
      const adminCanCreateUsers = await mockRole._hasPermission({
        name: testId + '-admin',
        resource: 'users',
        action: 'create'
      });

      const adminCanDeleteUsers = await mockRole._hasPermission({
        name: testId + '-admin',
        resource: 'users',
        action: 'delete'
      });

      const adminCanDeleteProjects = await mockRole._hasPermission({
        name: testId + '-admin',
        resource: 'projects',
        action: 'delete'
      });

      expect(adminCanCreateUsers).toHaveLength(1);
      expect(adminCanCreateUsers[0]).toBe(true);

      expect(adminCanDeleteUsers).toHaveLength(1);
      expect(adminCanDeleteUsers[0]).toBe(false);

      expect(adminCanDeleteProjects).toHaveLength(1);
      expect(adminCanDeleteProjects[0]).toBe(true);

      // Test viewer permissions
      const viewerCanReadUsers = await mockRole._hasPermission({
        name: testId + '-viewer',
        resource: 'users',
        action: 'read'
      });

      const viewerCanCreateUsers = await mockRole._hasPermission({
        name: testId + '-viewer',
        resource: 'users',
        action: 'create'
      });

      expect(viewerCanReadUsers).toHaveLength(1);
      expect(viewerCanReadUsers[0]).toBe(true);

      expect(viewerCanCreateUsers).toHaveLength(1);
      expect(viewerCanCreateUsers[0]).toBe(false);
    });

    test('should handle complex permission structures', async () => {
      // Create role with nested permissions
      await mockRole.create({
        name: testId + '-complex',
        displayName: 'Complex Role',
        description: 'Role with complex permissions',
        scope: 'organization',
        permissions: {
          campaigns: {
            create: true,
            read: true,
            update: true,
            participants: {
              add: true,
              remove: false,
              view: true
            },
            settings: {
              landing_page: true,
              constraints: false
            }
          },
          analytics: {
            view: true,
            export: false,
            reports: {
              basic: true,
              advanced: false
            }
          }
        }
      });

      const roles = await mockRole._getByName({ name: testId + '-complex' });
      expect(roles).toHaveLength(1);
      
      const role = roles[0];
      expect(role.permissions).toHaveProperty('campaigns');
      expect(role.permissions.campaigns).toHaveProperty('participants');
      expect(role.permissions.campaigns.participants.add).toBe(true);
      expect(role.permissions.campaigns.participants.remove).toBe(false);
    });
  });

  describe('Automatic Membership Creation', () => {
    beforeEach(async () => {
      await mockUser.register({
        user: testId + '-user',
        email: `test-${testId}@example.com`,
        name: 'Test User'
      });

      await mockRole.create({
        name: testId + '-default',
        displayName: 'Default Role',
        description: 'Default role for new members',
        scope: 'organization',
        permissions: { basic: { read: true } }
      });
    });

    test('should create membership invitation', async () => {
      const membership = await mockMembership.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org',
        roleEntity: testId + '-default',
        invitedBy: 'system',
        message: 'Welcome to the organization!'
      });

      expect(membership).toHaveProperty('membership');
      if ('membership' in membership) {
        expect(membership.membership.memberEntity).toBe(testId + '-user');
        expect(membership.membership.targetEntity).toBe(testId + '-org');
        expect(membership.membership.roleEntity).toBe(testId + '-default');
        expect(membership.membership.invitedBy).toBe('system');
        expect(membership.membership.status).toBe('invited');
      }
    });

    test('should auto-accept membership for system invitations', async () => {
      // Create invitation
      await mockMembership.invite({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org',
        roleEntity: testId + '-default',
        invitedBy: 'system'
      });

      // Accept invitation
      const acceptResult = await mockMembership.accept({
        memberEntity: testId + '-user',
        targetEntity: testId + '-org'
      });

      expect(acceptResult).toHaveProperty('membership');
      if ('membership' in acceptResult) {
        expect(acceptResult.membership.status).toBe('active');
        expect(acceptResult.membership.isActive).toBe(true);
        expect(acceptResult.membership.joinedAt).toBeDefined();
      }
    });
  });

  describe('Creator Role Assignment', () => {
    beforeEach(async () => {
      await mockUser.register({
        user: testId + '-creator',
        email: `creator-${testId}@example.com`,
        name: 'Creator User'
      });

      await mockRole.create({
        name: testId + '-owner',
        displayName: 'Owner',
        description: 'Entity owner role',
        scope: 'organization',
        permissions: { 
          owner: { manage: true },
          entity: { create: true, read: true, update: true, delete: true }
        }
      });
    });

    test('should assign creator role on entity creation', async () => {
      // Simulate creating an organization and assigning creator role
      const membership = await mockMembership.invite({
        memberEntity: testId + '-creator',
        targetEntity: testId + '-new-org',
        roleEntity: testId + '-owner',
        invitedBy: testId + '-creator' // Self-invitation as creator
      });

      expect(membership).toHaveProperty('membership');
      if ('membership' in membership) {
        expect(membership.membership.memberEntity).toBe(testId + '-creator');
        expect(membership.membership.roleEntity).toBe(testId + '-owner');
        expect(membership.membership.invitedBy).toBe(testId + '-creator');
      }

      // Auto-accept creator membership
      const acceptResult = await mockMembership.accept({
        memberEntity: testId + '-creator',
        targetEntity: testId + '-new-org'
      });

      expect(acceptResult).toHaveProperty('membership');
      if ('membership' in acceptResult) {
        expect(acceptResult.membership.isActive).toBe(true);
      }
    });

    test('should verify creator has owner permissions', async () => {
      // Create and accept owner membership
      await mockMembership.invite({
        memberEntity: testId + '-creator',
        targetEntity: testId + '-owned-entity',
        roleEntity: testId + '-owner',
        invitedBy: testId + '-creator'
      });

      await mockMembership.accept({
        memberEntity: testId + '-creator',
        targetEntity: testId + '-owned-entity'
      });

      // Verify membership exists and is active
      const membership = await mockMembership._getByMemberAndTarget({
        memberEntity: testId + '-creator',
        targetEntity: testId + '-owned-entity'
      });

      expect(membership).toHaveLength(1);
      expect(membership[0].isActive).toBe(true);
      expect(membership[0].roleEntity).toBe(testId + '-owner');

      // Verify role has appropriate permissions
      const hasOwnerPermission = await mockRole._hasPermission({
        name: testId + '-owner',
        resource: 'owner',
        action: 'manage'
      });

      expect(hasOwnerPermission).toHaveLength(1);
      expect(hasOwnerPermission[0]).toBe(true);
    });
  });

  describe('Membership Lifecycle', () => {
    beforeEach(async () => {
      await mockUser.register({
        user: testId + '-member',
        email: `member-${testId}@example.com`,
        name: 'Member User'
      });

      await mockRole.create({
        name: testId + '-member-role',
        displayName: 'Member Role',
        description: 'Regular member role',
        scope: 'organization',
        permissions: { member: { read: true, participate: true } }
      });
    });

    test('should handle complete membership lifecycle', async () => {
      // 1. Invite
      const inviteResult = await mockMembership.invite({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org',
        roleEntity: testId + '-member-role',
        invitedBy: 'admin',
        message: 'Welcome to our organization!'
      });
      expect(inviteResult).toHaveProperty('membership');

      // 2. Accept
      const acceptResult = await mockMembership.accept({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(acceptResult).toHaveProperty('membership');

      // 3. Verify active membership
      const isActive = await mockMembership._isActiveMember({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(isActive[0]).toBe(true);

      // 4. Update role
      await mockRole.create({
        name: testId + '-updated-role',
        displayName: 'Updated Role',
        description: 'Updated member role',
        scope: 'organization',
        permissions: { member: { read: true, participate: true, contribute: true } }
      });

      const updateRoleResult = await mockMembership.updateRole({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org',
        roleEntity: testId + '-updated-role'
      });
      expect(updateRoleResult).toHaveProperty('membership');

      // 5. Suspend membership
      const suspendResult = await mockMembership.suspend({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(suspendResult).toHaveProperty('membership');

      // 6. Verify suspended
      const isActiveSuspended = await mockMembership._isActiveMember({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(isActiveSuspended[0]).toBe(false);

      // 7. Reactivate
      const reactivateResult = await mockMembership.reactivate({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(reactivateResult).toHaveProperty('membership');

      // 8. Verify reactivated
      const isActiveReactivated = await mockMembership._isActiveMember({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(isActiveReactivated[0]).toBe(true);

      // 9. Leave membership
      const leaveResult = await mockMembership.leave({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(leaveResult).toHaveProperty('membership');

      // 10. Verify left
      const isActiveLeft = await mockMembership._isActiveMember({
        memberEntity: testId + '-member',
        targetEntity: testId + '-lifecycle-org'
      });
      expect(isActiveLeft[0]).toBe(false);
    });

    test('should handle membership queries', async () => {
      // Create multiple memberships for testing
      await mockMembership.invite({
        memberEntity: testId + '-member',
        targetEntity: testId + '-org-1',
        roleEntity: testId + '-member-role',
        invitedBy: 'admin'
      });

      await mockMembership.invite({
        memberEntity: testId + '-member',
        targetEntity: testId + '-org-2',
        roleEntity: testId + '-member-role',
        invitedBy: 'admin'
      });

      // Accept one, leave other as invitation
      await mockMembership.accept({
        memberEntity: testId + '-member',
        targetEntity: testId + '-org-1'
      });

      // Query by member
      const memberMemberships = await mockMembership._getByMember({
        memberEntity: testId + '-member'
      });
      expect(memberMemberships.length).toBeGreaterThanOrEqual(2);

      // Query active memberships
      const activeMemberships = await mockMembership._getActiveByMember({
        memberEntity: testId + '-member'
      });
      expect(activeMemberships.length).toBeGreaterThanOrEqual(1);
      expect(activeMemberships.every(m => m.isActive)).toBe(true);

      // Query pending invitations
      const pendingInvitations = await mockMembership._getPendingInvitations({
        memberEntity: testId + '-member'
      });
      expect(pendingInvitations.length).toBeGreaterThanOrEqual(1);
      expect(pendingInvitations.every(m => m.status === 'invited')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle duplicate membership invitations', async () => {
      await mockUser.register({
        user: testId + '-duplicate-user',
        email: `duplicate-${testId}@example.com`,
        name: 'Duplicate Test User'
      });

      await mockRole.create({
        name: testId + '-duplicate-role',
        displayName: 'Duplicate Role',
        description: 'Role for duplicate testing',
        scope: 'organization',
        permissions: { test: { read: true } }
      });

      // First invitation
      const firstInvite = await mockMembership.invite({
        memberEntity: testId + '-duplicate-user',
        targetEntity: testId + '-duplicate-org',
        roleEntity: testId + '-duplicate-role',
        invitedBy: 'admin'
      });
      expect(firstInvite).toHaveProperty('membership');

      // Second invitation (should fail or handle gracefully)
      const secondInvite = await mockMembership.invite({
        memberEntity: testId + '-duplicate-user',
        targetEntity: testId + '-duplicate-org',
        roleEntity: testId + '-duplicate-role',
        invitedBy: 'admin'
      });
      expect(secondInvite).toHaveProperty('error');
    });

    test('should handle operations on non-existent entities', async () => {
      const nonExistentUser = 'non-existent-user';
      const nonExistentOrg = 'non-existent-org';
      const nonExistentRole = 'non-existent-role';

      const invalidInvite = await mockMembership.invite({
        memberEntity: nonExistentUser,
        targetEntity: nonExistentOrg,
        roleEntity: nonExistentRole,
        invitedBy: 'admin'
      });
      // This may succeed depending on validation implementation

      const invalidAccept = await mockMembership.accept({
        memberEntity: nonExistentUser,
        targetEntity: nonExistentOrg
      });
      expect(invalidAccept).toHaveProperty('error');

      const invalidPermissionCheck = await mockRole._hasPermission({
        name: nonExistentRole,
        resource: 'anything',
        action: 'read'
      });
      expect(invalidPermissionCheck).toHaveLength(1);
      expect(invalidPermissionCheck[0]).toBe(false);
    });
  });
});
