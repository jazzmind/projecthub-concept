import { PrismaClient, IndustryPartner } from "@prisma/client";

const prisma = new PrismaClient();

export class IndustryPartnerConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    name: string;
    email: string;
    title: string;
    organizationId: string;
    focusAreas: string[];
    experienceLevel: string;
    timezone: string;
  }): Promise<{ industryPartner: IndustryPartner } | { error: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return { error: "Invalid email format" };
      }

      // Check if contact email already exists
      const existingPartner = await this.prisma.industryPartner.findFirst({
        where: { contactPersonEmail: input.email }
      });
      if (existingPartner) {
        return { error: "Industry partner with this email already exists" };
      }

      // Validate experience level
      const validLevels = ["junior", "mid", "senior", "executive"];
      if (!validLevels.includes(input.experienceLevel)) {
        return { error: "Invalid experience level" };
      }

      const industryPartner = await this.prisma.industryPartner.create({
        data: {
          companyName: input.name,
          contactPersonEmail: input.email,
          contactPersonName: input.name,
          contactPersonTitle: input.title || "",
          industry: input.focusAreas?.[0] || "Technology",
          companySize: "Medium",
          experienceLevel: input.experienceLevel,
          contactPreferences: {
            email: true,
            phone: false,
            linkedin: false
          },
          engagementTypes: [],
          availableResources: [],
        }
      });

      return { industryPartner };
    } catch (error) {
      return { error: `Failed to create industry partner: ${error}` };
    }
  }

  async update(input: {
    id: string;
    name?: string;
    title?: string;
    focusAreas?: string[];
    experienceLevel?: string;
    linkedinUrl?: string;
    phoneNumber?: string;
    timezone?: string;
  }): Promise<{ industryPartner: IndustryPartner } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.focusAreas !== undefined) updateData.focusAreas = input.focusAreas;
      if (input.experienceLevel !== undefined) {
        const validLevels = ["junior", "mid", "senior", "executive"];
        if (!validLevels.includes(input.experienceLevel)) {
          return { error: "Invalid experience level" };
        }
        updateData.experienceLevel = input.experienceLevel;
      }
      if (input.linkedinUrl !== undefined) updateData.linkedinUrl = input.linkedinUrl;
      if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;
      if (input.timezone !== undefined) updateData.timezone = input.timezone;

      const industryPartner = await this.prisma.industryPartner.update({
        where: { id: input.id },
        data: updateData
      });

      return { industryPartner };
    } catch (error) {
      return { error: `Failed to update industry partner: ${error}` };
    }
  }

  async updateContactPreferences(input: {
    id: string;
    preferences: object;
  }): Promise<{ industryPartner: IndustryPartner } | { error: string }> {
    try {
      const industryPartner = await this.prisma.industryPartner.update({
        where: { id: input.id },
        data: {
          contactPreferences: input.preferences
        }
      });

      return { industryPartner };
    } catch (error) {
      return { error: `Failed to update contact preferences: ${error}` };
    }
  }

  async updateStatus(input: {
    id: string;
    status: string;
  }): Promise<{ industryPartner: IndustryPartner } | { error: string }> {
    try {
      const validStatuses = ["active", "inactive", "prospective"];
      if (!validStatuses.includes(input.status)) {
        return { error: "Invalid status" };
      }

      const industryPartner = await this.prisma.industryPartner.update({
        where: { id: input.id },
        data: {
          isActive: input.status === "active"
        }
      });

      return { industryPartner };
    } catch (error) {
      return { error: `Failed to update status: ${error}` };
    }
  }

  async recordContact(input: { id: string }): Promise<{ industryPartner: IndustryPartner } | { error: string }> {
    try {
      // Note: lastContactedAt field doesn't exist in current schema
      const industryPartner = await this.prisma.industryPartner.findUnique({
        where: { id: input.id }
      });
      
      if (!industryPartner) {
        return { error: "Industry partner not found" };
      }

      return { industryPartner };
    } catch (error) {
      return { error: `Failed to record contact: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      await this.prisma.industryPartner.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete industry partner: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<IndustryPartner[]> {
    try {
      const partner = await this.prisma.industryPartner.findUnique({
        where: { id: input.id }
      });
      return partner ? [partner] : [];
    } catch {
      return [];
    }
  }

  async _getByEmail(input: { email: string }): Promise<IndustryPartner[]> {
    try {
      const partner = await this.prisma.industryPartner.findFirst({
        where: { contactPersonEmail: input.email }
      });
      return partner ? [partner] : [];
    } catch {
      return [];
    }
  }

  async _getByOrganization(input: { organizationId: string }): Promise<IndustryPartner[]> {
    try {
      // Note: IndustryPartner model doesn't have organizationId field in current schema
      return [];
    } catch {
      return [];
    }
  }

  async _getByFocusArea(input: { focusArea: string }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: {
          industry: input.focusArea
        }
      });
      return partners;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: { isActive: input.status === "active" }
      });
      return partners;
    } catch {
      return [];
    }
  }

  async _getByExperienceLevel(input: { level: string }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: { experienceLevel: input.level }
      });
      return partners;
    } catch {
      return [];
    }
  }

  async _getRecentlyContacted(input: { days: number }): Promise<IndustryPartner[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      const partners = await this.prisma.industryPartner.findMany({
        where: {
          createdAt: {
            gte: cutoffDate
          }
        }
      });
      return partners;
    } catch {
      return [];
    }
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: {
          OR: input.keywords.flatMap(keyword => [
            { companyName: { contains: keyword, mode: "insensitive" } },
            { contactPersonName: { contains: keyword, mode: "insensitive" } },
            { industry: { contains: keyword, mode: "insensitive" } }
          ])
        }
      });
      return partners;
    } catch {
      return [];
    }
  }
}