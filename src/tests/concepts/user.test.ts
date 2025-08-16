import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { UserConcept } from '@/lib/concepts/common/user';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const userConcept = new UserConcept();

describe('UserConcept', () => {
  let testUserId: string;
  let testEmail: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
    
    testUserId = 'test-user-' + Date.now();
    testEmail = `test-${Date.now()}@example.com`;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        id: testUserId,
        email: testEmail,
        name: 'John Doe'
      };

      const result = await userConcept.register(userData);

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.id).toBe(testUserId);
        expect(result.user.email).toBe(testEmail);
        expect(result.user.name).toBe('John Doe');
        expect(result.user.emailVerified).toBe(false);
        expect(result.user.isActive).toBe(true);
        expect(result.user.isSuspended).toBe(false);
      }
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        id: testUserId,
        email: testEmail,
        name: 'John Doe'
      };

      // Register first user
      await userConcept.register(userData);

      // Try to register with same email
      const duplicateData = {
        id: testUserId + '-duplicate',
        email: testEmail,
        name: 'Jane Doe'
      };

      const result = await userConcept.register(duplicateData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('email');
      }
    });

    test('should prevent duplicate user identifier', async () => {
      const userData = {
        id: testUserId,
        email: testEmail,
        name: 'John Doe'
      };

      // Register first user
      await userConcept.register(userData);

      // Try to register with same user identifier
      const duplicateData = {
        id: testUserId,
        email: `different-${Date.now()}@example.com`,
        name: 'Jane Doe'
      };

      const result = await userConcept.register(duplicateData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('user');
      }
    });
  });

  describe('verifyEmail', () => {
    beforeEach(async () => {
      await userConcept.register({
        email: testEmail,
        name: 'John Doe'
      });
    });

    test('should verify user email', async () => {
      const result = await userConcept.verifyEmail({ id: testUserId });

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.emailVerified).toBe(true);
      }
    });

    test('should handle verifying non-existent user', async () => {
      const result = await userConcept.verifyEmail({ id: 'non-existent' });

      expect(result).toHaveProperty('error');
    });
  });

  describe('updateProfile', () => {
    beforeEach(async () => {
      await userConcept.register({
        email: testEmail,
        name: 'John Doe'
      });
    });

    test('should update user profile', async () => {
      const updateData = {
        id: testUserId,
        name: 'John Smith',
        image: 'https://example.com/avatar.jpg',
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false
          }
        }
      };

      const result = await userConcept.updateUser(updateData);

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.name).toBe('John Smith');
        expect(result.user.image).toBe('https://example.com/avatar.jpg');
      }
    });

    test('should handle partial updates', async () => {
      const updateData = {
        id: testUserId,
        name: 'Updated Name'
      };

      const result = await userConcept.updateUser(updateData);

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.name).toBe('Updated Name');
        expect(result.user.email).toBe(testEmail); // Should remain unchanged
      }
    });
  });

  describe('updateLastLogin', () => {
    beforeEach(async () => {
      await userConcept.register({
        email: testEmail,
        name: 'John Doe'
      });
    });

    test('should update last login timestamp', async () => {
      const beforeTime = new Date();
      const result = await userConcept.updateLastLogin({ id: testUserId });
      const afterTime = new Date();

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.lastLoginAt).not.toBeNull();
        const loginTime = new Date(result.user.lastLoginAt!);
        expect(loginTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(loginTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });

  describe('suspendUser', () => {
    beforeEach(async () => {
      await userConcept.register({
        email: testEmail,
        name: 'John Doe'
      });
    });

    test('should suspend user with reason', async () => {
      const reason = 'Violation of terms of service';
      const result = await userConcept.suspendUser({ 
        id: testUserId, 
        reason 
      });

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.isSuspended).toBe(true);
        expect(result.user.suspendedReason).toBe(reason);
        expect(result.user.suspendedAt).not.toBeNull();
      }
    });
  });

  describe('unsuspendUser', () => {
    beforeEach(async () => {
      await userConcept.register({
        email: testEmail,
        name: 'John Doe'
      });
      await userConcept.suspendUser({ 
        id: testUserId, 
        reason: 'Test suspension' 
      });
    });

    test('should unsuspend user', async () => {
      const result = await userConcept.unsuspendUser({ id: testUserId });

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.isSuspended).toBe(false);
        expect(result.user.suspendedReason).toBeNull();
        expect(result.user.suspendedAt).toBeNull();
      }
    });
  });

  describe('updatePreferences', () => {
    beforeEach(async () => {
      await userConcept.register({ 
        email: testEmail,
        name: 'John Doe'
      });
    });

    test('should update user preferences', async () => {
      const preferences = {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      };

      const result = await userConcept.updateUser({ 
        id: testUserId, 
        preferences 
      });

      expect(result).toHaveProperty('user');
      if ('user' in result) {
        expect(result.user.preferences).toEqual(preferences);
      }
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await userConcept.register({
        email: testEmail,
        name: 'John Doe'
      });
    });

    test('should soft delete user', async () => {
      const result = await userConcept.delete({ id: testUserId });

      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
      }

      // Check that user is deactivated
      const users = await userConcept._getById({ id: testUserId });
      expect(users).toHaveLength(1);
      expect(users[0].isActive).toBe(false);
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test users
      await userConcept.register({
        email: `test1-${Date.now()}@example.com`,
        name: 'User One'
      });

      await userConcept.register({
        email: `test2-${Date.now()}@example.com`,
        name: 'User Two'
      });

      // Verify one user
      await userConcept.verifyEmail({ id: testUserId + '-1' });

      // Suspend one user
      await userConcept.suspendUser({ 
        id: testUserId + '-2', 
        reason: 'Test suspension' 
      });
    });

    test('_getById should return specific user', async () => {
      const users = await userConcept._getById({ id: testUserId + '-1' });

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(testUserId + '-1');
    });

    test('_getByEmail should return user by email', async () => {
      const email = `test1-${Date.now() - 1000}@example.com`;
      // Need to create user with known email
      await userConcept.register({
        email: email,
        name: 'Email Test User'
      });

      const users = await userConcept._getByEmail({ email });
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(email);
    });

    test('_getActiveUsers should return only active users', async () => {
      const activeUsers = await userConcept._getActiveUsers();

      expect(activeUsers.length).toBeGreaterThanOrEqual(2);
      expect(activeUsers.every(u => u.isActive && !u.isSuspended)).toBe(true);
    });

    test('_getUnverifiedUsers should return unverified users', async () => {
      const unverifiedUsers = await userConcept._getUnverifiedUsers();

      expect(unverifiedUsers.length).toBeGreaterThanOrEqual(1);
      expect(unverifiedUsers.every(u => !u.emailVerified)).toBe(true);
    });

    test('_getSuspendedUsers should return suspended users', async () => {
      const suspendedUsers = await userConcept._getSuspendedUsers();

      expect(suspendedUsers.length).toBeGreaterThanOrEqual(1);
      expect(suspendedUsers.every(u => u.isSuspended)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle operations on non-existent user', async () => {
      const nonExistentId = 'non-existent-user';

      const verifyResult = await userConcept.verifyEmail({ id: nonExistentId });
      expect(verifyResult).toHaveProperty('error');

      const updateResult = await userConcept.updateUser({ 
        id: nonExistentId, 
        name: 'New Name' 
      });
      expect(updateResult).toHaveProperty('error');

      const suspendResult = await userConcept.suspendUser({ 
        id: nonExistentId, 
        reason: 'Test' 
      });
      expect(suspendResult).toHaveProperty('error');
    });

    test('should validate email format', async () => {
      const invalidEmailData = {
        id: testUserId,
        email: 'invalid-email-format',
        name: 'John Doe'
      };

      const result = await userConcept.register(invalidEmailData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('email');
      }
    });
  });
});
