import { PrismaClient, Project, ProjectDifficulty, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class ProjectConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    title: string;
    description: string;
    scope: string;
    learningObjectives: string[];
    industry: string;
    domain: string;
    difficulty: string;
    estimatedHours: number;
    requiredSkills: string[];
    deliverables: string[];
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate difficulty
      const validDifficulties = ["beginner", "intermediate", "advanced"];
      if (!validDifficulties.includes(input.difficulty)) {
        return { error: "Invalid difficulty level" };
      }

      // Validate estimated hours
      if (input.estimatedHours <= 0) {
        return { error: "Estimated hours must be positive" };
      }

      const project = await this.prisma.project.create({
        data: {
          title: input.title,
          description: input.description,
          learningObjectives: input.learningObjectives || [],
          domain: input.domain,
          difficulty: input.difficulty as ProjectDifficulty,
          estimatedHours: input.estimatedHours,
          requiredSkills: input.requiredSkills || [],
          deliverables: input.deliverables || [],
          status: "draft",
          organizationId: "default-org-id", // TODO: Get from context
          tags: [],
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to create project: ${error}` };
    }
  }

  async generateWithAI(input: {
    industry: string;
    domain: string;
    learningObjectives: string[];
    difficulty: string;
    estimatedHours: number;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate difficulty
      const validDifficulties = ["beginner", "intermediate", "advanced"];
      if (!validDifficulties.includes(input.difficulty)) {
        return { error: "Invalid difficulty level" };
      }

      // TODO: Implement AI generation with llamaindex
      // For now, create a template project
      const title = `AI-Generated ${input.domain} Project in ${input.industry}`;
      const description = `This project focuses on ${input.domain} concepts within the ${input.industry} industry, designed to achieve the specified learning objectives.`;
      const scope = `Students will work on a ${input.difficulty}-level project that takes approximately ${input.estimatedHours} hours to complete.`;

      const project = await this.prisma.project.create({
        data: {
          title,
          description,
          learningObjectives: input.learningObjectives,
          domain: input.domain,
          difficulty: input.difficulty as ProjectDifficulty,
          estimatedHours: input.estimatedHours,
          requiredSkills: [],
          deliverables: ["Project documentation", "Implementation", "Presentation"],
          status: "draft",
          tags: ["AI-generated"],
          organizationId: "default-org-id",
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to generate project with AI: ${error}` };
    }
  }

  async update(input: {
    id: string;
    title?: string;
    description?: string;
    scope?: string;
    learningObjectives?: string[];
    difficulty?: string;
    estimatedHours?: number;
    requiredSkills?: string[];
    deliverables?: string[];
    tags?: string[];
  }): Promise<{ project: Project } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.scope !== undefined) updateData.scope = input.scope;
      if (input.learningObjectives !== undefined) updateData.learningObjectives = input.learningObjectives;
      if (input.difficulty !== undefined) {
        const validDifficulties = ["beginner", "intermediate", "advanced"];
        if (!validDifficulties.includes(input.difficulty)) {
          return { error: "Invalid difficulty level" };
        }
        updateData.difficulty = input.difficulty as ProjectDifficulty;
      }
      if (input.estimatedHours !== undefined) {
        if (input.estimatedHours <= 0) {
          return { error: "Estimated hours must be positive" };
        }
        updateData.estimatedHours = input.estimatedHours;
      }
      if (input.requiredSkills !== undefined) updateData.requiredSkills = input.requiredSkills;
      if (input.deliverables !== undefined) updateData.deliverables = input.deliverables;
      if (input.tags !== undefined) updateData.tags = input.tags;

      const project = await this.prisma.project.update({
        where: { id: input.id },
        data: updateData
      });

      return { project };
    } catch (error) {
      return { error: `Failed to update project: ${error}` };
    }
  }

  async customize(input: {
    id: string;
    customizations: object;
    industryPartnerId: string;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate industry partner exists
      const partner = await this.prisma.industryPartner.findUnique({
        where: { id: input.industryPartnerId }
      });
      if (!partner) {
        return { error: "Industry partner not found" };
      }

      const project = await this.prisma.project.update({
        where: { id: input.id },
        data: {
          description: input.customizations || "Customized project"
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to customize project: ${error}` };
    }
  }

  async assignExpert(input: {
    id: string;
    expertId: string;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate expert exists
      const expert = await this.prisma.expert.findUnique({
        where: { id: input.expertId }
      });
      if (!expert) {
        return { error: "Expert not found" };
      }

      const project = await this.prisma.project.update({
        where: { id: input.id },
        data: {
          expertId: input.expertId
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to assign expert: ${error}` };
    }
  }

  async assignToCampaign(input: {
    id: string;
    campaignId: string;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.campaignId }
      });
      if (!campaign) {
        return { error: "Campaign not found" };
      }

      const project = await this.prisma.project.update({
        where: { id: input.id },
        data: {
          description: "Assigned to campaign"
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to assign to campaign: ${error}` };
    }
  }

  async updateStatus(input: {
    id: string;
    status: string;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      const validStatuses = ["draft", "active", "in_progress", "completed", "archived"];
      if (!validStatuses.includes(input.status)) {
        return { error: "Invalid status" };
      }

      const project = await this.prisma.project.update({
        where: { id: input.id },
        data: {
          status: input.status as ProjectStatus
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to update status: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: input.id }
      });

      if (!project) {
        return { error: "Project not found" };
      }

      if (project.status === "in_progress") {
        return { error: "Cannot delete project that is in progress" };
      }

      await this.prisma.project.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete project: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Project[]> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: input.id }
      });
      return project ? [project] : [];
    } catch {
      return [];
    }
  }

  async _getByIndustry(input: { industry: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { domain: input.industry }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByDomain(input: { domain: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { domain: input.domain }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByDifficulty(input: { difficulty: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { difficulty: input.difficulty as ProjectDifficulty }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByCampaign(input: { campaignId: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { organizationId: input.campaignId }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByIndustryPartner(input: { industryPartnerId: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { industryPartnerId: input.industryPartnerId }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByExpert(input: { expertId: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { expertId: input.expertId }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { status: input.status as ProjectStatus }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          OR: input.keywords.flatMap(keyword => [
            { title: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            { tags: { has: keyword } }
          ])
        }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getRecommendationsForPartner(input: {
    industryPartnerId: string;
    limit: number;
  }): Promise<Project[]> {
    try {
      // Get partner's focus areas
      const partner = await this.prisma.industryPartner.findUnique({
        where: { id: input.industryPartnerId }
      });

      if (!partner) {
        return [];
      }

      // Find projects that match partner's focus areas
      const projects = await this.prisma.project.findMany({
        where: {
          domain: { contains: partner.industry, mode: "insensitive" },
          status: "published"
        },
        take: input.limit
      });

      return projects;
    } catch {
      return [];
    }
  }
}