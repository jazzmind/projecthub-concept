import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { MembershipConcept } from '@/lib/concepts/common/membership';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const membershipConcept = new MembershipConcept();

describe('MembershipConcept', () => {
  let testMemberId: string;
  let testTargetId: string;
  let testRoleId: string;
  let testInviterId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.membership.deleteMany({});
    
    testMemberId = 'test-member-' + Date.now();
    testTargetId = 'test-target-' + Date.now();
    testRoleId = 'test-role-' + Date.now();
    testInviterId = 'test-inviter-' + Date.now();
  });

  afterEach(async () => {
    await prisma.membership.deleteMany({});
  });

  describe('invite', () => {
    test('should create membership invitation successfully', async () => {
      const inviteData = {
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId,
        message: 'Welcome to the team!'
      };

      const result = await membershipConcept.invite(inviteData);

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.memberEntity).toBe(testMemberId);
        expect(result.membership.targetEntity).toBe(testTargetId);
        expect(result.membership.roleEntity).toBe(testRoleId);
        expect(result.membership.invitedBy).toBe(testInviterId);
        expect(result.membership.invitationMessage).toBe('Welcome to the team!');
        expect(result.membership.status).toBe('invited');
        expect(result.membership.isActive).toBe(false);
        expect(result.membership.invitedAt).toBeDefined();
      }
    });

    test('should handle invitation without message', async () => {
      const inviteData = {
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      };

      const result = await membershipConcept.invite(inviteData);

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.invitationMessage).toBeNull();
      }
    });

    test('should prevent duplicate invitations', async () => {
      const inviteData = {
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      };

      // Create first invitation
      await membershipConcept.invite(inviteData);

      // Try to create duplicate
      const duplicateResult = await membershipConcept.invite(inviteData);

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('already exists');
      }
    });
  });

  describe('accept', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
    });

    test('should accept invitation successfully', async () => {
      const result = await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.status).toBe('active');
        expect(result.membership.isActive).toBe(true);
        expect(result.membership.joinedAt).toBeDefined();
      }
    });

    test('should handle accepting non-existent invitation', async () => {
      const result = await membershipConcept.accept({
        memberEntity: 'non-existent',
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('error');
    });

    test('should prevent accepting already active membership', async () => {
      // Accept first time
      await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      // Try to accept again
      const result = await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('already active');
      }
    });
  });

  describe('reject', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
    });

    test('should reject invitation successfully', async () => {
      const result = await membershipConcept.reject({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.status).toBe('left');
        expect(result.membership.leftAt).toBeDefined();
      }
    });
  });

  describe('approve', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
    });

    test('should approve pending membership', async () => {
      const approverId = 'approver-' + Date.now();
      const result = await membershipConcept.approve({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        approvedBy: approverId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.status).toBe('active');
        expect(result.membership.isActive).toBe(true);
        expect(result.membership.approvedBy).toBe(approverId);
        expect(result.membership.approvedAt).toBeDefined();
        expect(result.membership.joinedAt).toBeDefined();
      }
    });
  });

  describe('suspend', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
    });

    test('should suspend active membership', async () => {
      const result = await membershipConcept.suspend({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.status).toBe('suspended');
        expect(result.membership.isActive).toBe(false);
      }
    });
  });

  describe('reactivate', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      await membershipConcept.suspend({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
    });

    test('should reactivate suspended membership', async () => {
      const result = await membershipConcept.reactivate({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.status).toBe('active');
        expect(result.membership.isActive).toBe(true);
      }
    });
  });

  describe('leave', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
    });

    test('should leave membership successfully', async () => {
      const result = await membershipConcept.leave({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.status).toBe('left');
        expect(result.membership.isActive).toBe(false);
        expect(result.membership.leftAt).toBeDefined();
      }
    });
  });

  describe('updateRole', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
    });

    test('should update membership role', async () => {
      const newRoleId = 'new-role-' + Date.now();
      const result = await membershipConcept.updateRole({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: newRoleId
      });

      expect(result).toHaveProperty('membership');
      if ('membership' in result) {
        expect(result.membership.roleEntity).toBe(newRoleId);
      }
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.reject({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
    });

    test('should delete inactive membership', async () => {
      const result = await membershipConcept.delete({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
      }

      // Verify membership is deleted
      const memberships = await membershipConcept._getByMemberAndTarget({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(memberships).toHaveLength(0);
    });

    test('should prevent deleting active membership', async () => {
      // Create and accept new membership
      const newMemberId = testMemberId + '-active';
      await membershipConcept.invite({
        memberEntity: newMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: newMemberId,
        targetEntity: testTargetId
      });

      const result = await membershipConcept.delete({
        memberEntity: newMemberId,
        targetEntity: testTargetId
      });

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('active');
      }
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test memberships
      const members = [testMemberId + '-1', testMemberId + '-2', testMemberId + '-3'];
      const targets = [testTargetId + '-org', testTargetId + '-project'];
      const roles = [testRoleId + '-admin', testRoleId + '-member'];

      // Create various memberships
      await membershipConcept.invite({
        memberEntity: members[0],
        targetEntity: targets[0],
        roleEntity: roles[0],
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: members[0],
        targetEntity: targets[0]
      });

      await membershipConcept.invite({
        memberEntity: members[1],
        targetEntity: targets[0],
        roleEntity: roles[1],
        invitedBy: testInviterId
      });
      // Leave this one as invited

      await membershipConcept.invite({
        memberEntity: members[0],
        targetEntity: targets[1],
        roleEntity: roles[1],
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: members[0],
        targetEntity: targets[1]
      });
      await membershipConcept.suspend({
        memberEntity: members[0],
        targetEntity: targets[1]
      });

      await membershipConcept.invite({
        memberEntity: members[2],
        targetEntity: targets[0],
        roleEntity: roles[0],
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: members[2],
        targetEntity: targets[0]
      });
    });

    test('_getByMember should return all memberships for member', async () => {
      const memberships = await membershipConcept._getByMember({
        memberEntity: testMemberId + '-1'
      });

      expect(memberships.length).toBeGreaterThanOrEqual(2);
      expect(memberships.every(m => m.memberEntity === testMemberId + '-1')).toBe(true);
    });

    test('_getByTarget should return all memberships for target', async () => {
      const memberships = await membershipConcept._getByTarget({
        targetEntity: testTargetId + '-org'
      });

      expect(memberships.length).toBeGreaterThanOrEqual(3);
      expect(memberships.every(m => m.targetEntity === testTargetId + '-org')).toBe(true);
    });

    test('_getByMemberAndTarget should return specific membership', async () => {
      const memberships = await membershipConcept._getByMemberAndTarget({
        memberEntity: testMemberId + '-1',
        targetEntity: testTargetId + '-org'
      });

      expect(memberships).toHaveLength(1);
      expect(memberships[0].memberEntity).toBe(testMemberId + '-1');
      expect(memberships[0].targetEntity).toBe(testTargetId + '-org');
    });

    test('_getActiveByMember should return only active memberships', async () => {
      const activeMemberships = await membershipConcept._getActiveByMember({
        memberEntity: testMemberId + '-1'
      });

      expect(activeMemberships.length).toBeGreaterThanOrEqual(1);
      expect(activeMemberships.every(m => m.isActive)).toBe(true);
    });

    test('_getActiveByTarget should return only active memberships for target', async () => {
      const activeMemberships = await membershipConcept._getActiveByTarget({
        targetEntity: testTargetId + '-org'
      });

      expect(activeMemberships.length).toBeGreaterThanOrEqual(2);
      expect(activeMemberships.every(m => m.isActive)).toBe(true);
    });

    test('_getByRole should return memberships with specific role', async () => {
      const adminMemberships = await membershipConcept._getByRole({
        roleEntity: testRoleId + '-admin'
      });

      expect(adminMemberships.length).toBeGreaterThanOrEqual(2);
      expect(adminMemberships.every(m => m.roleEntity === testRoleId + '-admin')).toBe(true);
    });

    test('_getByStatus should return memberships with specific status', async () => {
      const invitedMemberships = await membershipConcept._getByStatus({
        status: 'invited'
      });

      expect(invitedMemberships.length).toBeGreaterThanOrEqual(1);
      expect(invitedMemberships.every(m => m.status === 'invited')).toBe(true);
    });

    test('_getPendingInvitations should return pending invitations for member', async () => {
      const pendingInvitations = await membershipConcept._getPendingInvitations({
        memberEntity: testMemberId + '-2'
      });

      expect(pendingInvitations.length).toBeGreaterThanOrEqual(1);
      expect(pendingInvitations.every(m => m.status === 'invited')).toBe(true);
    });

    test('_isActiveMember should check membership status', async () => {
      const isActive1 = await membershipConcept._isActiveMember({
        memberEntity: testMemberId + '-1',
        targetEntity: testTargetId + '-org'
      });

      const isActive2 = await membershipConcept._isActiveMember({
        memberEntity: testMemberId + '-2',
        targetEntity: testTargetId + '-org'
      });

      expect(isActive1).toHaveLength(1);
      expect(isActive1[0]).toBe(true);

      expect(isActive2).toHaveLength(1);
      expect(isActive2[0]).toBe(false);
    });

    test('_hasRole should check role assignment', async () => {
      const hasAdminRole = await membershipConcept._hasRole({
        memberEntity: testMemberId + '-1',
        targetEntity: testTargetId + '-org',
        roleEntity: testRoleId + '-admin'
      });

      const hasMemberRole = await membershipConcept._hasRole({
        memberEntity: testMemberId + '-1',
        targetEntity: testTargetId + '-org',
        roleEntity: testRoleId + '-member'
      });

      expect(hasAdminRole).toHaveLength(1);
      expect(hasAdminRole[0]).toBe(true);

      expect(hasMemberRole).toHaveLength(1);
      expect(hasMemberRole[0]).toBe(false);
    });
  });

  describe('workflow scenarios', () => {
    test('should handle complete invitation workflow', async () => {
      // 1. Invite
      const inviteResult = await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId,
        message: 'Join our team!'
      });
      expect(inviteResult).toHaveProperty('membership');

      // 2. Check pending invitation
      const pending = await membershipConcept._getPendingInvitations({
        memberEntity: testMemberId
      });
      expect(pending.length).toBe(1);

      // 3. Accept invitation
      const acceptResult = await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(acceptResult).toHaveProperty('membership');

      // 4. Verify active membership
      const isActive = await membershipConcept._isActiveMember({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(isActive[0]).toBe(true);

      // 5. Update role
      const newRole = testRoleId + '-updated';
      const updateResult = await membershipConcept.updateRole({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: newRole
      });
      expect(updateResult).toHaveProperty('membership');

      // 6. Leave membership
      const leaveResult = await membershipConcept.leave({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(leaveResult).toHaveProperty('membership');

      // 7. Verify left status
      const isActiveAfterLeave = await membershipConcept._isActiveMember({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(isActiveAfterLeave[0]).toBe(false);
    });

    test('should handle approval workflow', async () => {
      // 1. Invite
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });

      // 2. Approve (instead of member accepting)
      const approveResult = await membershipConcept.approve({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        approvedBy: 'admin-' + Date.now()
      });
      expect(approveResult).toHaveProperty('membership');

      // 3. Verify active membership
      const isActive = await membershipConcept._isActiveMember({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(isActive[0]).toBe(true);
    });

    test('should handle suspension and reactivation workflow', async () => {
      // 1. Create active membership
      await membershipConcept.invite({
        memberEntity: testMemberId,
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      });
      await membershipConcept.accept({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });

      // 2. Suspend
      const suspendResult = await membershipConcept.suspend({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(suspendResult).toHaveProperty('membership');

      // 3. Verify suspended
      const isActiveSuspended = await membershipConcept._isActiveMember({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(isActiveSuspended[0]).toBe(false);

      // 4. Reactivate
      const reactivateResult = await membershipConcept.reactivate({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(reactivateResult).toHaveProperty('membership');

      // 5. Verify reactivated
      const isActiveReactivated = await membershipConcept._isActiveMember({
        memberEntity: testMemberId,
        targetEntity: testTargetId
      });
      expect(isActiveReactivated[0]).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle operations on non-existent membership', async () => {
      const nonExistentMember = 'non-existent-member';
      const nonExistentTarget = 'non-existent-target';

      const acceptResult = await membershipConcept.accept({
        memberEntity: nonExistentMember,
        targetEntity: nonExistentTarget
      });
      expect(acceptResult).toHaveProperty('error');

      const suspendResult = await membershipConcept.suspend({
        memberEntity: nonExistentMember,
        targetEntity: nonExistentTarget
      });
      expect(suspendResult).toHaveProperty('error');

      const updateRoleResult = await membershipConcept.updateRole({
        memberEntity: nonExistentMember,
        targetEntity: nonExistentTarget,
        roleEntity: 'some-role'
      });
      expect(updateRoleResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidInviteData = {
        memberEntity: '',
        targetEntity: testTargetId,
        roleEntity: testRoleId,
        invitedBy: testInviterId
      };

      const result = await membershipConcept.invite(invalidInviteData);
      expect(result).toHaveProperty('error');
    });
  });
});
