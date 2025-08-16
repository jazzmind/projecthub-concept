import { PrismaClient, Team } from "@prisma/client";

const prisma = new PrismaClient();

export class TeamConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    name: string;
    description?: string;
  }): Promise<{ team: Team } | { error: string }> {
    try {
      // Validate required fields
      if (!input.name) {
        return { error: "Name is required" };
      }

  
      const team = await this.prisma.team.create({
        data: {
          name: input.name,
          description: input.description,
          status: "forming",
        }
      });

      return { team };
    } catch (error) {
      return { error: `Failed to create team: ${error}` };
    }
  }

  async update(input: {
    id: string;
    name?: string;
    description?: string;
    status?: string;
  }): Promise<{ team: Team } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;

      const team = await this.prisma.team.update({
        where: { id: input.id },
        data: updateData
      });

      return { team };
    } catch (error) {
      return { error: `Failed to update team: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      await this.prisma.team.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete team: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Team[]> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });
      return team ? [team] : [];
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: { status: input.status }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          OR: input.keywords.flatMap(keyword => [
            { name: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } }
          ])
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  // Legacy methods for sync compatibility
  // TODO: These should be replaced with Membership concept operations
  async addStudent(input: { id: string; studentId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      // This is a compatibility method for the existing sync
      // In the generic architecture, this would be handled by Membership concept
      // For now, return the team unchanged
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });
      
      if (!team) {
        return { error: "Team not found" };
      }
      
      return { team };
    } catch (error) {
      return { error: `Failed to add student: ${error}` };
    }
  }
}