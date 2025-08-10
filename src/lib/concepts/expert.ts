import { PrismaClient, Expert, ExpertAvailability } from "@prisma/client";

const prisma = new PrismaClient();

export class ExpertConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    name: string;
    email: string;
    bio: string;
    expertiseDomains: string[];
    organizationId?: string;
    timezone: string;
  }): Promise<{ expert: Expert } | { error: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return { error: "Invalid email format" };
      }

      // Check if email already exists
      const existingExpert = await this.prisma.expert.findUnique({
        where: { email: input.email }
      });
      if (existingExpert) {
        return { error: "Expert with this email already exists" };
      }

      // Validate organization if provided
      if (input.organizationId) {
        const organization = await this.prisma.organization.findUnique({
          where: { id: input.organizationId }
        });
        if (!organization) {
          return { error: "Organization not found" };
        }
      }

      const expert = await this.prisma.expert.create({
        data: {
          name: input.name,
          email: input.email,
          bio: input.bio,
          expertiseDomains: input.expertiseDomains,
          organizationId: input.organizationId,
          availability: "available",
          rating: 0,
          totalProjects: 0,
          languages: [],
          timezone: input.timezone,
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
          availability: input.availability as ExpertAvailability
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

      // Calculate new weighted average rating
      const totalRating = expert.rating * expert.totalProjects + input.rating;
      const newTotalProjects = expert.totalProjects + 1;
      const newRating = totalRating / newTotalProjects;

      const updatedExpert = await this.prisma.expert.update({
        where: { id: input.id },
        data: {
          totalProjects: newTotalProjects,
          rating: newRating
        }
      });

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
      const expert = await this.prisma.expert.findUnique({
        where: { email: input.email }
      });
      return expert ? [expert] : [];
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
      const experts = await this.prisma.expert.findMany({
        where: { organizationId: input.organizationId }
      });
      return experts;
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
        orderBy: { rating: "desc" },
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