import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { RoleConcept } from '@/lib/concepts/common/role';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const roleConcept = new RoleConcept();

describe('RoleConcept', () => {
  let testRoleName: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.role.deleteMany({});
    
    testRoleName = 'test-role-' + Date.now();
  });

  afterEach(async () => {
    await prisma.role.deleteMany({});
  });

  describe('create', () => {
    test('should create a new role successfully', async () => {
      const roleData = {
        name: testRoleName,
        displayName: 'Test Role',
        description: 'A role for testing purposes',
        scope: 'organization',
        permissions: {
          users: { read: true, create: false },
          projects: { read: true, create: true, update: true }
        }
      };

      const result = await roleConcept.create(roleData);

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.name).toBe(testRoleName);
        expect(result.role.displayName).toBe('Test Role');
        expect(result.role.description).toBe('A role for testing purposes');
        expect(result.role.scope).toBe('organization');
        expect(result.role.isActive).toBe(true);
        expect(result.role.isBuiltIn).toBe(false);
        expect(result.role.permissions).toEqual(roleData.permissions);
      }
    });

    test('should prevent duplicate role names within same scope', async () => {
      const roleData = {
        name: testRoleName,
        displayName: 'First Role',
        description: 'First role',
        scope: 'organization',
        permissions: { users: { read: true } }
      };

      // Create first role
      await roleConcept.create(roleData);

      // Try to create duplicate
      const duplicateData = {
        ...roleData,
        displayName: 'Duplicate Role',
        description: 'Duplicate role'
      };

      const result = await roleConcept.create(duplicateData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('name');
      }
    });

    test('should allow same role name in different scopes', async () => {
      const orgRoleData = {
        name: testRoleName,
        displayName: 'Org Admin',
        description: 'Organization admin',
        scope: 'organization',
        permissions: { users: { read: true } }
      };

      const projectRoleData = {
        name: testRoleName,
        displayName: 'Project Admin',
        description: 'Project admin',
        scope: 'project',
        permissions: { tasks: { read: true } }
      };

      const orgResult = await roleConcept.create(orgRoleData);
      const projectResult = await roleConcept.create(projectRoleData);

      expect(orgResult).toHaveProperty('role');
      expect(projectResult).toHaveProperty('role');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await roleConcept.create({
        name: testRoleName,
        displayName: 'Original Role',
        description: 'Original description',
        scope: 'organization',
        permissions: { users: { read: true } }
      });
    });

    test('should update role successfully', async () => {
      const updateData = {
        name: testRoleName,
        displayName: 'Updated Role',
        description: 'Updated description',
        permissions: {
          users: { read: true, create: true },
          projects: { read: true, update: true }
        }
      };

      const result = await roleConcept.update(updateData);

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.displayName).toBe('Updated Role');
        expect(result.role.description).toBe('Updated description');
        expect(result.role.permissions).toEqual(updateData.permissions);
      }
    });

    test('should prevent updating built-in roles', async () => {
      // Create a built-in role
      await prisma.role.update({
        where: { 
          name_scope: {
            name: testRoleName,
            scope: 'organization'
          }
        },
        data: { isBuiltIn: true }
      });

      const updateData = {
        name: testRoleName,
        displayName: 'Should Not Update'
      };

      const result = await roleConcept.update(updateData);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('built-in');
      }
    });

    test('should handle partial updates', async () => {
      const updateData = {
        name: testRoleName,
        displayName: 'Only Display Name Updated'
      };

      const result = await roleConcept.update(updateData);

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.displayName).toBe('Only Display Name Updated');
        expect(result.role.description).toBe('Original description'); // Should remain unchanged
      }
    });
  });

  describe('activate/deactivate', () => {
    beforeEach(async () => {
      await roleConcept.create({
        name: testRoleName,
        displayName: 'Test Role',
        description: 'Test description',
        scope: 'organization',
        permissions: { users: { read: true } }
      });
    });

    test('should deactivate role', async () => {
      const result = await roleConcept.deactivate({ name: testRoleName });

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.isActive).toBe(false);
      }
    });

    test('should reactivate role', async () => {
      await roleConcept.deactivate({ name: testRoleName });
      
      const result = await roleConcept.activate({ name: testRoleName });

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.isActive).toBe(true);
      }
    });

    test('should prevent deactivating built-in roles', async () => {
      // Make role built-in
      await prisma.role.update({
        where: { 
          name_scope: {
            name: testRoleName,
            scope: 'organization'
          }
        },
        data: { isBuiltIn: true }
      });

      const result = await roleConcept.deactivate({ name: testRoleName });

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('built-in');
      }
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await roleConcept.create({
        name: testRoleName,
        displayName: 'Test Role',
        description: 'Test description',
        scope: 'organization',
        permissions: { users: { read: true } }
      });
    });

    test('should delete non-built-in role', async () => {
      const result = await roleConcept.delete({ name: testRoleName });

      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
      }

      // Verify role is deleted
      const roles = await roleConcept._getByName({ name: testRoleName });
      expect(roles).toHaveLength(0);
    });

    test('should prevent deleting built-in roles', async () => {
      // Make role built-in
      await prisma.role.update({
        where: { 
          name_scope: {
            name: testRoleName,
            scope: 'organization'
          }
        },
        data: { isBuiltIn: true }
      });

      const result = await roleConcept.delete({ name: testRoleName });

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('built-in');
      }
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test roles
      await roleConcept.create({
        name: testRoleName + '-admin',
        displayName: 'Admin Role',
        description: 'Administrator role',
        scope: 'organization',
        permissions: { 
          users: { read: true, create: true, update: true, delete: true },
          projects: { read: true, create: true, update: true, delete: true }
        }
      });

      await roleConcept.create({
        name: testRoleName + '-user',
        displayName: 'User Role',
        description: 'Regular user role',
        scope: 'organization',
        permissions: { 
          users: { read: true },
          projects: { read: true, create: true }
        }
      });

      await roleConcept.create({
        name: testRoleName + '-project',
        displayName: 'Project Role',
        description: 'Project-specific role',
        scope: 'project',
        permissions: { 
          tasks: { read: true, create: true, update: true }
        }
      });

      // Deactivate one role
      await roleConcept.deactivate({ name: testRoleName + '-user' });

      // Make one role built-in
      await prisma.role.update({
        where: { 
          name_scope: {
            name: testRoleName + '-admin',
            scope: 'organization'
          }
        },
        data: { isBuiltIn: true }
      });
    });

    test('_getByName should return specific role', async () => {
      const roles = await roleConcept._getByName({ name: testRoleName + '-admin' });

      expect(roles).toHaveLength(1);
      expect(roles[0].name).toBe(testRoleName + '-admin');
    });

    test('_getByScope should return roles for specific scope', async () => {
      const orgRoles = await roleConcept._getByScope({ scope: 'organization' });
      const projectRoles = await roleConcept._getByScope({ scope: 'project' });

      expect(orgRoles.length).toBeGreaterThanOrEqual(2);
      expect(projectRoles.length).toBeGreaterThanOrEqual(1);
      expect(orgRoles.every(r => r.scope === 'organization')).toBe(true);
      expect(projectRoles.every(r => r.scope === 'project')).toBe(true);
    });

    test('_getActive should return only active roles', async () => {
      const activeRoles = await roleConcept._getActive();

      expect(activeRoles.length).toBeGreaterThanOrEqual(2);
      expect(activeRoles.every(r => r.isActive)).toBe(true);
    });

    test('_getBuiltIn should return only built-in roles', async () => {
      const builtInRoles = await roleConcept._getBuiltIn();

      expect(builtInRoles.length).toBeGreaterThanOrEqual(1);
      expect(builtInRoles.every(r => r.isBuiltIn)).toBe(true);
    });

    test('_hasPermission should check role permissions correctly', async () => {
      const hasCreateUsers = await roleConcept._hasPermission({
        name: testRoleName + '-admin',
        resource: 'users',
        action: 'create'
      });

      const hasDeleteUsers = await roleConcept._hasPermission({
        name: testRoleName + '-project',
        resource: 'users',
        action: 'delete'
      });

      expect(hasCreateUsers).toHaveLength(1);
      expect(hasCreateUsers[0]).toBe(true);

      expect(hasDeleteUsers).toHaveLength(1);
      expect(hasDeleteUsers[0]).toBe(false);
    });
  });

  describe('permission management', () => {
    beforeEach(async () => {
      await roleConcept.create({
        name: testRoleName,
        displayName: 'Test Role',
        description: 'Test role for permissions',
        scope: 'organization',
        permissions: {
          users: { read: true, create: false },
          projects: { read: true, create: true, update: false }
        }
      });
    });

    test('should handle complex permission structures', async () => {
      const complexPermissions = {
        users: { 
          read: true, 
          create: true, 
          update: true, 
          delete: false,
          manage: true 
        },
        projects: { 
          read: true, 
          create: true, 
          update: true, 
          delete: true,
          publish: true,
          archive: false 
        },
        teams: { 
          read: true, 
          join: true, 
          leave: true, 
          manage_members: false 
        }
      };

      const result = await roleConcept.update({
        name: testRoleName,
        permissions: complexPermissions
      });

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.permissions).toEqual(complexPermissions);
      }
    });

    test('should handle nested permission checks', async () => {
      // Update with nested permissions
      await roleConcept.update({
        name: testRoleName,
        permissions: {
          campaigns: {
            read: true,
            participants: {
              add: true,
              remove: false,
              view: true
            }
          }
        }
      });

      const roles = await roleConcept._getByName({ name: testRoleName });
      expect(roles).toHaveLength(1);
      expect(roles[0].permissions).toHaveProperty('campaigns');
    });
  });

  describe('edge cases', () => {
    test('should handle operations on non-existent role', async () => {
      const nonExistentName = 'non-existent-role';

      const updateResult = await roleConcept.update({
        name: nonExistentName,
        displayName: 'Should Fail'
      });
      expect(updateResult).toHaveProperty('error');

      const activateResult = await roleConcept.activate({ name: nonExistentName });
      expect(activateResult).toHaveProperty('error');

      const deleteResult = await roleConcept.delete({ name: nonExistentName });
      expect(deleteResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidRoleData = {
        name: '', // Empty name
        displayName: 'Test Role',
        description: 'Test description',
        scope: 'organization',
        permissions: {}
      };

      const result = await roleConcept.create(invalidRoleData);

      expect(result).toHaveProperty('error');
    });

    test('should handle empty permissions object', async () => {
      const roleData = {
        name: testRoleName,
        displayName: 'No Permissions Role',
        description: 'Role with no permissions',
        scope: 'organization',
        permissions: {}
      };

      const result = await roleConcept.create(roleData);

      expect(result).toHaveProperty('role');
      if ('role' in result) {
        expect(result.role.permissions).toEqual({});
      }
    });
  });
});
