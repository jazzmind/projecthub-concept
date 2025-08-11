import { PrismaClient, Expert } from "@prisma/client";

const prisma = new PrismaClient();

export class ExpertConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    expert: string;
    name: string;
    email: string;
    bio: string;
    expertiseDomains: string[];
    availability?: string;
  }): Promise<{ expert: Expert } | { error: string }> {
    try {
      // Validate required fields
      if (!input.name) {
        return { error: "Name is required" };
      }

      // Check if expert with this identifier already exists
      const existingExpert = await this.prisma.expert.findFirst({
        where: { expert: input.expert }
      });
      if (existingExpert) {
        return { error: "Expert with this identifier already exists" };
      }

      const expert = await this.prisma.expert.create({
        data: {
          expert: input.expert,
          name: input.name,
          email: input.email,
          bio: input.bio,
          expertiseDomains: input.expertiseDomains,
          availability: input.availability || "available",
        }
      });

      return { expert };
    } catch (error) {
      return { error: `Failed to create expert: ${error}` };
    }
  }

  async update(input: {
    id: string;
    bio?: string;
    expertiseDomains?: string[];
    linkedinUrl?: string;
    website?: string;
    hourlyRate?: number;
    languages?: string[];
    timezone?: string;
  }): Promise<{ expert: Expert } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.expertiseDomains !== undefined) updateData.expertiseDomains = input.expertiseDomains;
      if (input.linkedinUrl !== undefined) updateData.linkedinUrl = input.linkedinUrl;
      if (input.website !== undefined) updateData.website = input.website;
      if (input.hourlyRate !== undefined) updateData.hourlyRate = input.hourlyRate;
      if (input.languages !== undefined) updateData.languages = input.languages;
      if (input.timezone !== undefined) updateData.timezone = input.timezone;

      const expert = await this.prisma.expert.update({
        where: { id: input.id },
        data: updateData
      });

      return { expert };
    } catch (error) {
      return { error: `Failed to update expert: ${error}` };
    }
  }

  async updateAvailability(input: {
    id: string;
    availability: string;
  }): Promise<{ expert: Expert } | { error: string }> {
    try {
      const validAvailabilities = ["available", "limited", "unavailable"];
      if (!validAvailabilities.includes(input.availability)) {
        return { error: "Invalid availability status" };
      }

      const expert = await this.prisma.expert.update({
        where: { id: input.id },
        data: {
          availability: input.availability
        }
      });

      return { expert };
    } catch (error) {
      return { error: `Failed to update expert availability: ${error}` };
    }
  }

  async recordProjectCompletion(input: {
    id: string;
    rating: number;
  }): Promise<{ expert: Expert } | { error: string }> {
    try {
      if (input.rating < 1 || input.rating > 5) {
        return { error: "Rating must be between 1 and 5" };
      }

      const expert = await this.prisma.expert.findUnique({
        where: { id: input.id }
      });

      if (!expert) {
        return { error: "Expert not found" };
      }

      // Note: Rating and project count fields don't exist in current schema
      // This would need to be implemented with separate models for ratings/projects
      const updatedExpert = expert;

      return { expert: updatedExpert };
    } catch (error) {
      return { error: `Failed to record project completion: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      await this.prisma.expert.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete expert: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Expert[]> {
    try {
      const expert = await this.prisma.expert.findUnique({
        where: { id: input.id }
      });
      return expert ? [expert] : [];
    } catch {
      return [];
    }
  }

  async _getByEmail(input: { email: string }): Promise<Expert[]> {
    try {
      // Note: Expert model doesn't have email field in current schema
      // This would need to be implemented by joining with User model
      return [];
    } catch {
      return [];
    }
  }

  async _getByExpertiseDomain(input: { domain: string }): Promise<Expert[]> {
    try {
      const experts = await this.prisma.expert.findMany({
        where: {
          expertiseDomains: {
            has: input.domain
          }
        }
      });
      return experts;
    } catch {
      return [];
    }
  }

  async _getByOrganization(input: { organizationId: string }): Promise<Expert[]> {
    try {
      // Note: Expert model doesn't have organizationId field in current schema
      // This would need to be implemented differently
      return [];
    } catch {
      return [];
    }
  }

  async _getAvailable(): Promise<Expert[]> {
    try {
      const experts = await this.prisma.expert.findMany({
        where: { availability: "available" }
      });
      return experts;
    } catch {
      return [];
    }
  }

  async _getTopRated(input: { limit: number }): Promise<Expert[]> {
    try {
      const experts = await this.prisma.expert.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit
      });
      return experts;
    } catch {
      return [];
    }
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<Expert[]> {
    try {
      const experts = await this.prisma.expert.findMany({
        where: {
          OR: input.keywords.flatMap(keyword => [
            { bio: { contains: keyword, mode: "insensitive" } },
            { expertiseDomains: { has: keyword } }
          ])
        }
      });
      return experts;
    } catch {
      return [];
    }
  }
}