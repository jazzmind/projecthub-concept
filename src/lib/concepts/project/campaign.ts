import { PrismaClient, Campaign } from "@prisma/client";

const prisma = new PrismaClient();

export class CampaignConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async listActive(): Promise<{ campaigns: Campaign[] } | { error: string }> {
    try {
      const campaigns = await this.prisma.campaign.findMany({ where: { status: "active" } });
      return { campaigns };
    } catch (error) {
      return { error: `Failed to list active campaigns: ${error}` };
    }
  }

  async listAll(): Promise<{ campaigns: Campaign[] } | { error: string }> {
    try {
      const campaigns = await this.prisma.campaign.findMany({});
      return { campaigns };
    } catch (error) {
      return { error: `Failed to list campaigns: ${error}` };
    }
  }

  async get(input: { id: string }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const found = await this.prisma.campaign.findFirst({ where: { id: input.id } });
      if (!found) return { error: "Campaign not found" };
      return { campaign: found };
    } catch (error) {
      return { error: `Failed to get campaign: ${error}` };
    }
  }

  async create(input: {
    name: string;
    description: string;
    learningObjectives: string[];
    startDate: Date;
    contactEmail: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {

      const campaign = await this.prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          learningObjectives: input.learningObjectives,
          startDate: input.startDate,
          contactEmail: input.contactEmail,
          status: "draft",
          participantIds: [],
          industryConstraints: {},
          projectConstraints: {},
          landingPageConfig: {},
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
    contactEmail?: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.learningObjectives !== undefined) updateData.learningObjectives = input.learningObjectives;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;
      if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;

      const updated = await this.prisma.campaign.update({
        where: { id: existing.id },
        data: updateData
      });

      return { campaign: updated };
    } catch (error) {
      return { error: `Failed to update campaign: ${error}` };
    }
  }

  async updateStatus(input: {
    id: string;
    status: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      const updated = await this.prisma.campaign.update({
        where: { id: existing.id },
        data: { status: input.status }
      });

      return { campaign: updated };
    } catch (error) {
      return { error: `Failed to update campaign status: ${error}` };
    }
  }

  async addParticipant(input: {
    id: string;
    participantId: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      // Check if participant is already added
      if (existing.participantIds.includes(input.participantId)) {
        return { error: "Participant already in campaign" };
      }

      // Check max participants limit
      if (existing.maxParticipants && existing.participantIds.length >= existing.maxParticipants) {
        return { error: "Campaign has reached maximum participants" };
      }

      const updated = await this.prisma.campaign.update({
        where: { id: existing.id },
        data: {
          participantIds: [...existing.participantIds, input.participantId]
        }
      });

      return { campaign: updated };
    } catch (error) {
      return { error: `Failed to add participant: ${error}` };
    }
  }

  async removeParticipant(input: {
    id: string;
    participantId: string;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      const updated = await this.prisma.campaign.update({
        where: { id: existing.id },
        data: {
          participantIds: existing.participantIds.filter(id => id !== input.participantId)
        }
      });

      return { campaign: updated };
    } catch (error) {
      return { error: `Failed to remove participant: ${error}` };
    }
  }

  async updateConstraints(input: {
    id: string;
    industryConstraints?: object;
    projectConstraints?: object;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      const updateData: any = {};
      if (input.industryConstraints !== undefined) updateData.industryConstraints = input.industryConstraints;
      if (input.projectConstraints !== undefined) updateData.projectConstraints = input.projectConstraints;

      const updated = await this.prisma.campaign.update({
        where: { id: existing.id },
        data: updateData
      });

      return { campaign: updated };
    } catch (error) {
      return { error: `Failed to update constraints: ${error}` };
    }
  }

  async updateLandingPage(input: {
    id: string;
    landingPageConfig: object;
  }): Promise<{ campaign: Campaign } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      const updated = await this.prisma.campaign.update({
        where: { id: existing.id },
        data: { landingPageConfig: input.landingPageConfig }
      });

      return { campaign: updated };
    } catch (error) {
      return { error: `Failed to update landing page: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const existing = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });

      if (!existing) {
        return { error: "Campaign not found" };
      }

      // Don't allow deletion of active campaigns with participants
      if (existing.status === "active" && existing.participantIds.length > 0) {
        return { error: "Cannot delete active campaign with participants" };
      }

      await this.prisma.campaign.delete({
        where: { id: existing.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete campaign: ${error}` };
    }
  }

  // Queries
  async _getByName(input: { name: string }): Promise<Campaign[]> {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { name: input.name }
      });
      return campaign ? [campaign] : [];
    } catch {
      return [];
    }
  }

  async _getById(input: { id: string }): Promise<Campaign[]> {
    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: input.id }
      });
      return campaign ? [campaign] : [];
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: { status: input.status }
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

  async _getUpcoming(): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          startDate: {
            gte: new Date()
          }
        },
        orderBy: { startDate: "asc" }
      });
      return campaigns;
    } catch {
      return [];
    }
  }

  async _getByDateRange(input: { 
    startDate: Date; 
    endDate: Date; 
  }): Promise<Campaign[]> {
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

  async _getByParticipant(input: { participantId: string }): Promise<Campaign[]> {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          participantIds: {
            has: input.participantId
          }
        }
      });
      return campaigns;
    } catch {
      return [];
    }
  }
}