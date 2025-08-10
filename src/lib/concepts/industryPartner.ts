import { PrismaClient, IndustryPartner, ExperienceLevel, PartnerStatus } from "@prisma/client";

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

      // Check if email already exists
      const existingPartner = await this.prisma.industryPartner.findUnique({
        where: { email: input.email }
      });
      if (existingPartner) {
        return { error: "Industry partner with this email already exists" };
      }

      // Validate organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: input.organizationId }
      });
      if (!organization) {
        return { error: "Organization not found" };
      }

      // Validate experience level
      const validLevels = ["junior", "mid", "senior", "executive"];
      if (!validLevels.includes(input.experienceLevel)) {
        return { error: "Invalid experience level" };
      }

      const industryPartner = await this.prisma.industryPartner.create({
        data: {
          name: input.name,
          email: input.email,
          title: input.title,
          organizationId: input.organizationId,
          focusAreas: input.focusAreas,
          experienceLevel: input.experienceLevel as ExperienceLevel,
          contactPreferences: {
            email: true,
            phone: false,
            linkedin: false
          },
          timezone: input.timezone,
          status: "prospective",
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
        updateData.experienceLevel = input.experienceLevel as ExperienceLevel;
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
          status: input.status as PartnerStatus
        }
      });

      return { industryPartner };
    } catch (error) {
      return { error: `Failed to update status: ${error}` };
    }
  }

  async recordContact(input: { id: string }): Promise<{ industryPartner: IndustryPartner } | { error: string }> {
    try {
      const industryPartner = await this.prisma.industryPartner.update({
        where: { id: input.id },
        data: {
          lastContactedAt: new Date()
        }
      });

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
      const partner = await this.prisma.industryPartner.findUnique({
        where: { email: input.email }
      });
      return partner ? [partner] : [];
    } catch {
      return [];
    }
  }

  async _getByOrganization(input: { organizationId: string }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: { organizationId: input.organizationId }
      });
      return partners;
    } catch {
      return [];
    }
  }

  async _getByFocusArea(input: { focusArea: string }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: {
          focusAreas: {
            has: input.focusArea
          }
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
        where: { status: input.status as PartnerStatus }
      });
      return partners;
    } catch {
      return [];
    }
  }

  async _getByExperienceLevel(input: { level: string }): Promise<IndustryPartner[]> {
    try {
      const partners = await this.prisma.industryPartner.findMany({
        where: { experienceLevel: input.level as ExperienceLevel }
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
          lastContactedAt: {
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
            { name: { contains: keyword, mode: "insensitive" } },
            { title: { contains: keyword, mode: "insensitive" } },
            { focusAreas: { has: keyword } }
          ])
        }
      });
      return partners;
    } catch {
      return [];
    }
  }
}