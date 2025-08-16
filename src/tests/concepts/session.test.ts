import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { SessionConcept } from '@/lib/concepts/common/session';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const sessionConcept = new SessionConcept();

describe('SessionConcept', () => {
  let testSessionKey: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    
    testSessionKey = 'test-session-' + Date.now();
  });

  afterEach(async () => {
    await prisma.session.deleteMany({});
  });

  describe('create', () => {
    test('should create a new session successfully', async () => {
      const sessionData = {
        sessionKey: testSessionKey,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '192.168.1.1',
        loginMethod: 'email'
      };

      const result = await sessionConcept.create(sessionData);

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.sessionKey).toBe(testSessionKey);
        expect(result.session.userAgent).toBe('Mozilla/5.0 (Test Browser)');
        expect(result.session.ipAddress).toBe('192.168.1.1');
        expect(result.session.loginMethod).toBe('email');
        expect(result.session.isActive).toBe(true);
        expect(result.session.lastActivityAt).toBeDefined();
      }
    });

    test('should prevent duplicate session keys', async () => {
      const sessionData = {
        sessionKey: testSessionKey,
        loginMethod: 'email'
      };

      // Create first session
      await sessionConcept.create(sessionData);

      // Try to create duplicate
      const duplicateData = {
        sessionKey: testSessionKey,
        loginMethod: 'oauth'
      };

      const result = await sessionConcept.create(duplicateData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('sessionKey');
      }
    });

    test('should handle optional fields', async () => {
      const minimalSessionData = {
        sessionKey: testSessionKey,
        loginMethod: 'oauth'
      };

      const result = await sessionConcept.create(minimalSessionData);

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.sessionKey).toBe(testSessionKey);
        expect(result.session.loginMethod).toBe('oauth');
        expect(result.session.userAgent).toBeNull();
        expect(result.session.ipAddress).toBeNull();
      }
    });
  });

  describe('setContext', () => {
    beforeEach(async () => {
      await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email'
      });
    });

    test('should set session context', async () => {
      const context = 'org-123';
      const result = await sessionConcept.setContext({
        sessionKey: testSessionKey,
        context
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.currentContext).toBe(context);
      }
    });

    test('should update existing context', async () => {
      // Set initial context
      await sessionConcept.setContext({
        sessionKey: testSessionKey,
        context: 'org-123'
      });

      // Update to new context
      const newContext = 'project-456';
      const result = await sessionConcept.setContext({
        sessionKey: testSessionKey,
        context: newContext
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.currentContext).toBe(newContext);
      }
    });
  });

  describe('clearContext', () => {
    beforeEach(async () => {
      await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email'
      });
      await sessionConcept.setContext({
        sessionKey: testSessionKey,
        context: 'org-123'
      });
    });

    test('should clear session context', async () => {
      const result = await sessionConcept.clearContext({
        sessionKey: testSessionKey
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.currentContext).toBeNull();
      }
    });
  });

  describe('updateActivity', () => {
    beforeEach(async () => {
      await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email'
      });
    });

    test('should update last activity timestamp', async () => {
      // Get initial session
      const initialSessions = await sessionConcept._getBySessionKey({
        sessionKey: testSessionKey
      });
      const initialActivity = initialSessions[0].lastActivityAt;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await sessionConcept.updateActivity({
        sessionKey: testSessionKey
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.lastActivityAt.getTime())
          .toBeGreaterThan(initialActivity.getTime());
      }
    });

    test('should extend session if needed', async () => {
      const result = await sessionConcept.updateActivity({
        sessionKey: testSessionKey
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        // Session should still be active after activity update
        expect(result.session.isActive).toBe(true);
      }
    });
  });

  describe('updatePreferences', () => {
    beforeEach(async () => {
      await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email'
      });
    });

    test('should update session preferences', async () => {
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: {
          desktop: true,
          sound: false
        }
      };

      const result = await sessionConcept.updatePreferences({
        sessionKey: testSessionKey,
        preferences
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.preferences).toEqual(preferences);
      }
    });
  });

  describe('expire', () => {
    beforeEach(async () => {
      await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email'
      });
    });

    test('should expire session', async () => {
      const result = await sessionConcept.expire({
        sessionKey: testSessionKey
      });

      expect(result).toHaveProperty('session');
      if ('session' in result) {
        expect(result.session.isActive).toBe(false);
      }
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email'
      });
    });

    test('should delete session', async () => {
      const result = await sessionConcept.delete({
        sessionKey: testSessionKey
      });

      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
      }

      // Verify session is deleted
      const sessions = await sessionConcept._getBySessionKey({
        sessionKey: testSessionKey
      });
      expect(sessions).toHaveLength(0);
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test sessions
      await sessionConcept.create({
        sessionKey: testSessionKey + '-1',
        loginMethod: 'email',
        userAgent: 'Browser 1'
      });

      await sessionConcept.create({
        sessionKey: testSessionKey + '-2',
        loginMethod: 'oauth',
        userAgent: 'Browser 2'
      });

      await sessionConcept.create({
        sessionKey: testSessionKey + '-3',
        loginMethod: 'email',
        userAgent: 'Browser 3'
      });

      // Set context for one session
      await sessionConcept.setContext({
        sessionKey: testSessionKey + '-1',
        context: 'org-123'
      });

      // Expire one session
      await sessionConcept.expire({
        sessionKey: testSessionKey + '-2'
      });

      // Set expiration date in the past for one session
      await prisma.session.update({
        where: { sessionKey: testSessionKey + '-3' },
        data: { expiresAt: new Date(Date.now() - 1000) }
      });
    });

    test('_getBySessionKey should return specific session', async () => {
      const sessions = await sessionConcept._getBySessionKey({
        sessionKey: testSessionKey + '-1'
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionKey).toBe(testSessionKey + '-1');
    });

    test('_getActive should return active session', async () => {
      const activeSessions = await sessionConcept._getActive({
        sessionKey: testSessionKey + '-1'
      });

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].isActive).toBe(true);
    });

    test('_getCurrentContext should return session context', async () => {
      const contexts = await sessionConcept._getCurrentContext({
        sessionKey: testSessionKey + '-1'
      });

      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toBe('org-123');
    });

    test('_isActiveSession should check session status', async () => {
      const activeCheck1 = await sessionConcept._isActiveSession({
        sessionKey: testSessionKey + '-1'
      });

      const activeCheck2 = await sessionConcept._isActiveSession({
        sessionKey: testSessionKey + '-2'
      });

      const activeCheck3 = await sessionConcept._isActiveSession({
        sessionKey: testSessionKey + '-3'
      });

      expect(activeCheck1).toHaveLength(1);
      expect(activeCheck1[0]).toBe(true);

      expect(activeCheck2).toHaveLength(1);
      expect(activeCheck2[0]).toBe(false);

      expect(activeCheck3).toHaveLength(1);
      expect(activeCheck3[0]).toBe(false); // Expired
    });

    test('_getExpiredSessions should return expired sessions', async () => {
      const expiredSessions = await sessionConcept._getExpiredSessions();

      expect(expiredSessions.length).toBeGreaterThanOrEqual(1);
      // Should include the session with past expiration date
      const expiredSessionKeys = expiredSessions.map(s => s.sessionKey);
      expect(expiredSessionKeys).toContain(testSessionKey + '-3');
    });
  });

  describe('session lifecycle', () => {
    test('should handle complete session lifecycle', async () => {
      // Create session
      const createResult = await sessionConcept.create({
        sessionKey: testSessionKey,
        loginMethod: 'email',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1'
      });
      expect(createResult).toHaveProperty('session');

      // Set context
      const contextResult = await sessionConcept.setContext({
        sessionKey: testSessionKey,
        context: 'org-123'
      });
      expect(contextResult).toHaveProperty('session');

      // Update activity
      const activityResult = await sessionConcept.updateActivity({
        sessionKey: testSessionKey
      });
      expect(activityResult).toHaveProperty('session');

      // Update preferences
      const prefsResult = await sessionConcept.updatePreferences({
        sessionKey: testSessionKey,
        preferences: { theme: 'dark' }
      });
      expect(prefsResult).toHaveProperty('session');

      // Verify session is active
      const activeCheck = await sessionConcept._isActiveSession({
        sessionKey: testSessionKey
      });
      expect(activeCheck[0]).toBe(true);

      // Expire session
      const expireResult = await sessionConcept.expire({
        sessionKey: testSessionKey
      });
      expect(expireResult).toHaveProperty('session');

      // Verify session is inactive
      const inactiveCheck = await sessionConcept._isActiveSession({
        sessionKey: testSessionKey
      });
      expect(inactiveCheck[0]).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle operations on non-existent session', async () => {
      const nonExistentKey = 'non-existent-session';

      const setContextResult = await sessionConcept.setContext({
        sessionKey: nonExistentKey,
        context: 'org-123'
      });
      expect(setContextResult).toHaveProperty('error');

      const updateActivityResult = await sessionConcept.updateActivity({
        sessionKey: nonExistentKey
      });
      expect(updateActivityResult).toHaveProperty('error');

      const expireResult = await sessionConcept.expire({
        sessionKey: nonExistentKey
      });
      expect(expireResult).toHaveProperty('error');
    });

    test('should validate session key uniqueness', async () => {
      const sessionData = {
        sessionKey: testSessionKey,
        loginMethod: 'email'
      };

      // Create first session
      const firstResult = await sessionConcept.create(sessionData);
      expect(firstResult).toHaveProperty('session');

      // Try to create duplicate
      const duplicateResult = await sessionConcept.create(sessionData);
      expect(duplicateResult).toHaveProperty('error');
    });

    test('should handle invalid login methods', async () => {
      const invalidSessionData = {
        sessionKey: testSessionKey,
        loginMethod: '' // Empty login method
      };

      const result = await sessionConcept.create(invalidSessionData);
      expect(result).toHaveProperty('error');
    });
  });
});
