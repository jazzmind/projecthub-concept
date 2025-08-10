import { PrismaClient, User, UserRole, PlatformRole } from "@prisma/client";

const prisma = new PrismaClient();

export class UserConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    email: string;
    name: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return { error: "Invalid email format" };
      }

      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: input.email }
      });
      if (existingUser) {
        return { error: "User with this email already exists" };
      }

      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          isEmailVerified: false,
          isActive: true,
          isSuspended: false,
          platformRole: "user",
          organizationMemberships: [],
          preferences: {}
        }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to create user: ${error}` };
    }
  }

  async verifyEmail(input: { id: string }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.update({
        where: { id: input.id },
        data: { isEmailVerified: true }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to verify email: ${error}` };
    }
  }

  async updateProfile(input: {
    id: string;
    name?: string;
    avatar?: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.avatar !== undefined) updateData.avatar = input.avatar;

      const user = await this.prisma.user.update({
        where: { id: input.id },
        data: updateData
      });

      return { user };
    } catch (error) {
      return { error: `Failed to update profile: ${error}` };
    }
  }

  async addOrganizationMembership(input: {
    id: string;
    organizationId: string;
    role: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      // Validate role
      const validRoles = ["admin", "educator", "expert", "industry_partner", "learner"];
      if (!validRoles.includes(input.role)) {
        return { error: "Invalid role" };
      }

      // Validate organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: input.organizationId }
      });
      if (!organization) {
        return { error: "Organization not found" };
      }

      // Get current user
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      if (!user) {
        return { error: "User not found" };
      }

      // Check if membership already exists
      const memberships = (user.organizationMemberships as any[]) || [];
      const existingMembership = memberships.find(
        (m: any) => m.organizationId === input.organizationId
      );

      if (existingMembership) {
        return { error: "User already has membership in this organization" };
      }

      // Add new membership
      const newMembership = {
        organizationId: input.organizationId,
        role: input.role,
        isActive: true,
        joinedAt: new Date()
      };

      const updatedUser = await this.prisma.user.update({
        where: { id: input.id },
        data: {
          organizationMemberships: [...memberships, newMembership],
          // Set as current organization if user has none
          currentOrganizationId: user.currentOrganizationId || input.organizationId
        }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to add organization membership: ${error}` };
    }
  }

  async updateOrganizationRole(input: {
    id: string;
    organizationId: string;
    role: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      // Validate role
      const validRoles = ["admin", "educator", "expert", "industry_partner", "learner"];
      if (!validRoles.includes(input.role)) {
        return { error: "Invalid role" };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      if (!user) {
        return { error: "User not found" };
      }

      const memberships = (user.organizationMemberships as any[]) || [];
      const membershipIndex = memberships.findIndex(
        (m: any) => m.organizationId === input.organizationId
      );

      if (membershipIndex === -1) {
        return { error: "User is not a member of this organization" };
      }

      // Update role
      memberships[membershipIndex].role = input.role;

      const updatedUser = await this.prisma.user.update({
        where: { id: input.id },
        data: { organizationMemberships: memberships }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to update organization role: ${error}` };
    }
  }

  async removeOrganizationMembership(input: {
    id: string;
    organizationId: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      if (!user) {
        return { error: "User not found" };
      }

      const memberships = (user.organizationMemberships as any[]) || [];
      const filteredMemberships = memberships.filter(
        (m: any) => m.organizationId !== input.organizationId
      );

      const updateData: any = { organizationMemberships: filteredMemberships };

      // Clear current organization if it was the removed one
      if (user.currentOrganizationId === input.organizationId) {
        updateData.currentOrganizationId = null;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: input.id },
        data: updateData
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to remove organization membership: ${error}` };
    }
  }

  async setCurrentOrganization(input: {
    id: string;
    organizationId: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      if (!user) {
        return { error: "User not found" };
      }

      // Validate user is member of the organization
      const memberships = (user.organizationMemberships as any[]) || [];
      const membership = memberships.find(
        (m: any) => m.organizationId === input.organizationId && m.isActive
      );

      if (!membership) {
        return { error: "User is not an active member of this organization" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: input.id },
        data: { currentOrganizationId: input.organizationId }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to set current organization: ${error}` };
    }
  }

  async updateLastLogin(input: { id: string }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.update({
        where: { id: input.id },
        data: { lastLoginAt: new Date() }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to update last login: ${error}` };
    }
  }

  async suspendUser(input: {
    id: string;
    reason: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.update({
        where: { id: input.id },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: input.reason
        }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to suspend user: ${error}` };
    }
  }

  async unsuspendUser(input: { id: string }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.update({
        where: { id: input.id },
        data: {
          isSuspended: false,
          suspendedAt: null,
          suspendedReason: null
        }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to unsuspend user: ${error}` };
    }
  }

  async updatePreferences(input: {
    id: string;
    preferences: object;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const user = await this.prisma.user.update({
        where: { id: input.id },
        data: { preferences: input.preferences }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to update preferences: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      await this.prisma.user.update({
        where: { id: input.id },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete user: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<User[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      return user ? [user] : [];
    } catch {
      return [];
    }
  }

  async _getByEmail(input: { email: string }): Promise<User[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: input.email }
      });
      return user ? [user] : [];
    } catch {
      return [];
    }
  }

  async _getByOrganization(input: { organizationId: string }): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          organizationMemberships: {
            path: '$',
            array_contains: { organizationId: input.organizationId }
          }
        }
      });
      return users;
    } catch {
      return [];
    }
  }

  async _getAdminUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { platformRole: "admin" }
      });
      return users;
    } catch {
      return [];
    }
  }

  async _getActiveUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          isSuspended: false
        }
      });
      return users;
    } catch {
      return [];
    }
  }

  async _isAdmin(input: { id: string }): Promise<boolean[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      return [user?.platformRole === "admin" || false];
    } catch {
      return [false];
    }
  }

  async _hasOrganizationRole(input: {
    id: string;
    organizationId: string;
    role: string;
  }): Promise<boolean[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      
      if (!user) return [false];

      const memberships = (user.organizationMemberships as any[]) || [];
      const membership = memberships.find(
        (m: any) => m.organizationId === input.organizationId && m.role === input.role && m.isActive
      );

      return [!!membership];
    } catch {
      return [false];
    }
  }

  async _canAccessOrganization(input: {
    id: string;
    organizationId: string;
  }): Promise<boolean[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id }
      });
      
      if (!user) return [false];

      const memberships = (user.organizationMemberships as any[]) || [];
      const membership = memberships.find(
        (m: any) => m.organizationId === input.organizationId && m.isActive
      );

      return [!!membership];
    } catch {
      return [false];
    }
  }
}
