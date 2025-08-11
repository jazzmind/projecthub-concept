import { PrismaClient, Project } from "@prisma/client";

const prisma = new PrismaClient();

export class ProjectConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    project: string;
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
      // Validate required fields
      if (!input.title || !input.description) {
        return { error: "Title and description are required" };
      }

      // Check if project with this identifier already exists
      const existingProject = await this.prisma.project.findFirst({
        where: { project: input.project }
      });
      if (existingProject) {
        return { error: "Project with this identifier already exists" };
      }

      const project = await this.prisma.project.create({
        data: {
          project: input.project,
          title: input.title,
          description: input.description,
          scope: input.scope,
          learningObjectives: input.learningObjectives,
          industry: input.industry,
          domain: input.domain,
          difficulty: input.difficulty,
          estimatedHours: input.estimatedHours,
          requiredSkills: input.requiredSkills,
          deliverables: input.deliverables,
          status: "active",
          tags: [],
          aiGenerated: false,
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to create project: ${error}` };
    }
  }

  async update(input: {
    project: string;
    title?: string;
    description?: string;
    scope?: string;
    learningObjectives?: string[];
    industry?: string;
    domain?: string;
    difficulty?: string;
    estimatedHours?: number;
    requiredSkills?: string[];
    deliverables?: string[];
    status?: string;
    tags?: string[];
  }): Promise<{ project: Project } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.scope !== undefined) updateData.scope = input.scope;
      if (input.learningObjectives !== undefined) updateData.learningObjectives = input.learningObjectives;
      if (input.industry !== undefined) updateData.industry = input.industry;
      if (input.domain !== undefined) updateData.domain = input.domain;
      if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
      if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;
      if (input.requiredSkills !== undefined) updateData.requiredSkills = input.requiredSkills;
      if (input.deliverables !== undefined) updateData.deliverables = input.deliverables;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.tags !== undefined) updateData.tags = input.tags;

      const project = await this.prisma.project.update({
        where: { project: input.project },
        data: updateData
      });

      return { project };
    } catch (error) {
      return { error: `Failed to update project: ${error}` };
    }
  }

  async delete(input: { project: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      await this.prisma.project.delete({
        where: { project: input.project }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete project: ${error}` };
    }
  }

  // Queries
  async _getByProject(input: { project: string }): Promise<Project[]> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { project: input.project }
      });
      return project ? [project] : [];
    } catch {
      return [];
    }
  }

  async _getByIndustry(input: { industry: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { industry: input.industry }
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
        where: { difficulty: input.difficulty }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: { status: input.status }
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
            { scope: { contains: keyword, mode: "insensitive" } },
            { requiredSkills: { has: keyword } },
            { tags: { has: keyword } }
          ])
        }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByEstimatedHours(input: { minHours: number; maxHours: number }): Promise<Project[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          estimatedHours: {
            gte: input.minHours,
            lte: input.maxHours
          }
        }
      });
      return projects;
    } catch {
      return [];
    }
  }
}