import { PrismaClient, Project, Relationship } from "@prisma/client";
import { projectExtractionService } from "../../ai/projectExtractionService";

const prisma = new PrismaClient();

export class ProjectConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    title: string;
    description: string;
    image: string;
    scope: string;
    industry: string;
    domain: string;
    difficulty: string;
    estimatedHours: number;
    deliverables: string[];
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate required fields
      if (!input.title || !input.description) {
        return { error: "Title and description are required" };
      }

      const project = await this.prisma.project.create({
        data: {
          title: input.title,
          description: input.description,
          image: input.image,
          scope: input.scope,
          industry: input.industry,
          domain: input.domain,
          difficulty: input.difficulty,
          estimatedHours: input.estimatedHours,
          deliverables: input.deliverables,
          status: "active",
          aiGenerated: false,
        }
      });

      return { project };
    } catch (error) {
      return { error: `Failed to create project: ${error}` };
    }
  }

  async update(input: {
    id: string;
    title?: string;
    description?: string;
    image?: string;
    scope?: string;
    industry?: string;
    domain?: string;
    difficulty?: string;
    estimatedHours?: number;
    deliverables?: string[];
    status?: string;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.image !== undefined) updateData.image = input.image;
      if (input.scope !== undefined) updateData.scope = input.scope;
      if (input.industry !== undefined) updateData.industry = input.industry;
      if (input.domain !== undefined) updateData.domain = input.domain;
      if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
      if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;
      if (input.deliverables !== undefined) updateData.deliverables = input.deliverables;
      if (input.status !== undefined) updateData.status = input.status;

      const project = await this.prisma.project.update({
        where: { id: input.id },
        data: updateData
      });

      return { project };
    } catch (error) {
      return { error: `Failed to update project: ${error}` };
    }
  }

  async extractFromDocument(input: {
    fileBuffer: Buffer;
    originalFilename: string;
    organizationId: string;
    quality?: 'low' | 'medium' | 'high';
    onProgress?: (stage: string, progress: number) => void;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Extract project data from document using AI
      input.onProgress?.('Starting AI extraction', 0);
      const extractedData = await projectExtractionService.extractFromDocument(
        input.fileBuffer,
        input.originalFilename,
        input.organizationId,
        input.quality || 'medium',
        input.onProgress
      );

      // Generate project image
      input.onProgress?.('Generating project image', 85);
      let imageUrl: string | null = null;
      try {
        imageUrl = await projectExtractionService.generateProjectImage(
          extractedData.imagePrompt,
          extractedData.title,
          input.quality || 'medium'
        );
      } catch (imageError) {
        console.warn('Failed to generate project image:', imageError);
        // Continue without image - it's optional
      }

      // Create the project in database
      input.onProgress?.('Creating project record', 95);
      const project = await this.prisma.project.create({
        data: {
          title: extractedData.title,
          description: extractedData.description,
          image: imageUrl,
          scope: extractedData.scope,
          industry: extractedData.industry,
          domain: extractedData.domain,
          difficulty: extractedData.difficulty,
          estimatedHours: extractedData.estimatedHours,
          deliverables: extractedData.deliverables,
          status: "draft",
          aiGenerated: true,
          sourceData: {
            originalFilename: input.originalFilename,
            extractedAt: new Date().toISOString(),
            imagePrompt: extractedData.imagePrompt
          }
        }
      });

      // Create relationship between project and organization
      input.onProgress?.('Linking project to organization', 98);
      try {
        await this.prisma.relationship.create({
          data: {
            fromEntityType: 'project',
            fromEntityId: project.id,
            toEntityType: 'organization',
            toEntityId: input.organizationId,
            relationType: 'belongs_to',
            metadata: {
              createdBy: 'ai_extraction',
              sourceFile: input.originalFilename
            }
          }
        });
      } catch (relationshipError) {
        console.warn('Failed to create project-organization relationship:', relationshipError);
        // Continue without failing the whole operation
      }

      input.onProgress?.('Project created successfully', 100);
      return { project };
    } catch (error) {
      return { error: `Failed to extract project from document: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
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
            { industry: { contains: keyword, mode: "insensitive" } },
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

  async _getByOrganization(input: { organizationId: string }): Promise<Project[]> {
    try {
      // Get project IDs that belong to the organization via relationships
      const relationships = await this.prisma.relationship.findMany({
        where: {
          fromEntityType: 'project',
          toEntityType: 'organization',
          toEntityId: input.organizationId,
          relationType: 'belongs_to'
        }
      });

      const projectIds = relationships.map(rel => rel.fromEntityId);

      if (projectIds.length === 0) {
        return [];
      }

      // Get the actual projects
      const projects = await this.prisma.project.findMany({
        where: {
          id: { in: projectIds }
        },
        orderBy: { createdAt: 'desc' }
      });

      return projects;
    } catch {
      return [];
    }
  }
}