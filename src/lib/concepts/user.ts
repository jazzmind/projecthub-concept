import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

export class UserConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async register(input: {
    user: string;
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

      // Check if user identifier already exists
      const existingUserByIdentifier = await this.prisma.user.findFirst({
        where: { user: input.user }
      });
      if (existingUserByIdentifier) {
        return { error: "User with this identifier already exists" };
      }

      const user = await this.prisma.user.create({
        data: {
          user: input.user,
          email: input.email,
          name: input.name,
          isEmailVerified: false,
          isActive: true,
          isSuspended: false,
        }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to register user: ${error}` };
    }
  }

  async verifyEmail(input: { user: string }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { isEmailVerified: true }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to verify email: ${error}` };
    }
  }

  async updateProfile(input: {
    user: string;
    name?: string;
    avatar?: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.avatar !== undefined) updateData.avatar = input.avatar;

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: updateData
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to update profile: ${error}` };
    }
  }

  async updateLastLogin(input: { user: string }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to update last login: ${error}` };
    }
  }

  async suspendUser(input: {
    user: string;
    reason: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: input.reason
        }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to suspend user: ${error}` };
    }
  }

  async unsuspendUser(input: { user: string }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isSuspended: false,
          suspendedAt: null,
          suspendedReason: null
        }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to unsuspend user: ${error}` };
    }
  }

  async updatePreferences(input: {
    user: string;
    preferences: object;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { preferences: input.preferences }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to update preferences: ${error}` };
    }
  }

  async delete(input: { user: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { user: input.user }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete user: ${error}` };
    }
  }

  // Queries
  async _getById(input: { user: string }): Promise<User[]> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { user: input.user }
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

  async _getUnverifiedUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          isEmailVerified: false,
          isActive: true
        }
      });
      return users;
    } catch {
      return [];
    }
  }

  async _getSuspendedUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          isSuspended: true
        }
      });
      return users;
    } catch {
      return [];
    }
  }
}