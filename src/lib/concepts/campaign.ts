import { PrismaClient, Campaign, CampaignStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class CampaignConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    name: string;
    description: string;
    educationOrganizationId: string;
    learningObjectives: string[];
    startDate: Date;
    contactEmail: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.contactEmail)) {
        return { error: "Invalid email format" };
      }

      // Validate organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: input.educationOrganizationId }
      });
      if (!organization) {
        return { error: "Education organization not found" };
      }

      const campaign = await this.prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          educationOrganizationId: input.educationOrganizationId,
          learningObjectives: input.learningObjectives,
          industryConstraints: {
            allowedIndustries: [],
            forbiddenIndustries: [],
          },
          projectConstraints: {
            allowedDomains: [],
            difficulty: ["beginner", "intermediate", "advanced"],
            requiredSkills: [],
          },
          landingPageConfig: {
            title: input.name,
            subtitle: input.description,
            ctaText: "Get Started",
            customFields: [],
          },
          status: "draft",
          startDate: input.startDate
        }
      });

      return { campaign };
    } catch (error) {
      return { error: `Failed to create campaign: ${error}` };
    }
  }

  async update(input: {
    id: string;
    name?: string;
    description?: string;
    learningObjectives?: string[];
    startDate?: Date;
    endDate?: Date;
    participantLimit?: number;
    contactEmail?: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      // Validate email format if provided
      if (input.contactEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.contactEmail)) {
          return { error: "Invalid email format" };
        }
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.learningObjectives !== undefined) updateData.learningObjectives = input.learningObjectives;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;
      if (input.participantLimit !== undefined) updateData.participantLimit = input.participantLimit;
      if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;

      const campaign = await this.prisma.campaign.update({
        where: { id: input.id },
        data: updateData
      });

      return { campaign };
    } catch (error) {
      return { error: `Failed to update campaign: ${error}` };
    }
  }

  async updateConstraints(input: {
    id: string;
    industryConstraints?: object;
    projectConstraints?: object;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.industryConstraints !== undefined) updateData.industryConstraints = input.industryConstraints;
      if (input.projectConstraints !== undefined) updateData.projectConstraints = input.projectConstraints;

      const campaign = await this.prisma.campaign.update({
        where: { id: input.id },
        data: updateData
      });

      return { campaign };
    } catch (error) {
      return { error: `Failed to update campaign constraints: ${error}` };
    }
  }

  async updateLandingPageConfig(input: {
    id: string;
    config: object;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id: input.id },
        data: {
          landingPageConfig: input.config
        }
      });

      return { campaign };
    } catch (error) {
      return { error: `Failed to update landing page config: ${error}` };
    }
  }

  async updateStatus(input: {
    id: string;
    status: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const validStatuses = ["draft", "active", "paused", "completed", "archived"];
      if (!validStatuses.includes(input.status)) {
        return { error: "Invalid status" };
      }

      const campaign = await this.prisma.campaign.update({
        where: { id: input.id },
        data: {
          status: input.status as CampaignStatus
        }
      });

      return { campaign };
    } catch (error) {
      return { error: `Failed to update campaign status: ${error}` };
    }
  }

  async addParticipant(input: { id: string; participantId: string }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.id }
      });

      if (!campaign) {
        return { error: "Campaign not found" };
      }

      if (campaign.maxParticipants && campaign.participantIds.length >= campaign.maxParticipants) {
        return { error: "Campaign is at participant limit" };
      }

      const updatedCampaign = await this.prisma.campaign.update({
        where: { id: input.id },
        data: {
          participantIds: [...campaign.participantIds, input.participantId]
        }
      });

      return { campaign: updatedCampaign };
    } catch (error) {
      return { error: `Failed to add participant: ${error}` };
    }
  }

  async removeParticipant(input: { id: string; participantId: string }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.id }
      });

      if (!campaign) {
        return { error: "Campaign not found" };
      }

      const updatedCampaign = await this.prisma.campaign.update({
        where: { id: input.id },
        data: {
          participantIds: campaign.participantIds.filter(id => id !== input.participantId)
        }
      });

      return { campaign: updatedCampaign };
    } catch (error) {
      return { error: `Failed to remove participant: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.id }
      });

      if (!campaign) {
        return { error: "Campaign not found" };
      }

      if (campaign.status === "active") {
        return { error: "Cannot delete active campaign" };
      }

      await this.prisma.campaign.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete campaign: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Campaign[]> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.id }
      });
      return campaign ? [campaign] : [];
    } catch {
      return [];
    }
  }

  async _getByOrganization(input: { organizationId: string }): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: { educationOrganizationId: input.organizationId }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: { status: input.status as CampaignStatus }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _getActive(): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: { status: "active" }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _getByDateRange(input: { startDate: Date; endDate: Date }): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          startDate: {
            gte: input.startDate,
            lte: input.endDate
          }
        }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          OR: input.keywords.map(keyword => ({
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              { description: { contains: keyword, mode: "insensitive" } }
            ]
          }))
        }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _getAvailableForApplication(): Promise<Campaign[]> {
    try {
      const now = new Date();
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          status: "active",
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _getCampaignStats(input: { id: string }): Promise<object[]> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.id },
        include: {
          assignments: true,
          organization: true
        }
      });

      if (!campaign) {
        return [];
      }

      const stats = {
        campaignId: campaign.id,
        totalProjects: 0, // Would need separate query to count related projects
        totalAssignments: campaign.assignments.length,
        totalTeams: 0, // Would need separate query to count related teams
        currentParticipants: campaign.participantIds.length,
        participantLimit: campaign.maxParticipants,
        status: campaign.status,
        daysActive: campaign.startDate ? Math.floor((Date.now() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      };

      return [stats];
    } catch {
      return [];
    }
  }
}