import { PrismaClient, User } from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export class UserConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async register(input: {
    email: string;
    name: string;
    image?: string;
    emailVerified?: boolean;
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
          image: input.image,
          emailVerified: input.emailVerified || false,
          isActive: true,
          isSuspended: false,
        }
      });

      return { user };
    } catch (error) {
      return { error: `Failed to register user: ${error}` };
    }
  }

  async verifyEmail(input: { id: string }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: input.id }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: true }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to verify email: ${error}` };
    }
  }


  async updateLastLogin(input: { id: string }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: input.id }
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
    id: string;
    reason: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: input.id }
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

  async unsuspendUser(input: { id: string }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: input.id }
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

  async updateUser(input: {
    id: string;
    name?: string;
    image?: string;
    preferences?: object;
  }): Promise<{ user: User } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: input.id }
      });

      if (!existingUser) {
        return { error: "User not found" };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          name: input.name || existingUser.name, 
          image: input.image || existingUser.image, 
          preferences: input.preferences !== undefined ? input.preferences as InputJsonValue : undefined
        }
      });

      return { user: updatedUser };
    } catch (error) {
      return { error: `Failed to update preferences: ${error}` };
    }
  }

  // Add to User concept
  async create(input: {
    name: string;
    email: string;
  }): Promise<{ user: User } | { error: string }> {
    try {
      return await this.register({
        email: input.email,
        name: input.name,
      });
    } catch (error) {
      return { error: `Failed to create user: ${error}` };
    }
  }

  async search(input: { q: string }): Promise<{ users: User[] } | { error: string }> {
    try {
      const query = input.q.trim();
      if (!query) return { users: [] };
      
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          isSuspended: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 10, // Limit results
        orderBy: [
          { name: 'asc' }
        ]
      });
      
      return { users };
    } catch (error) {
      return { error: `Failed to search users: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: input.id }
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
    async _getById(input: { id: string }): Promise<User[]> {
    try {
      const user = await this.prisma.user.findFirst({
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
          emailVerified: false,
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