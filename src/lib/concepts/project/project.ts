import { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { projectExtractionService } from "../../ai/projectExtractionService";

export class ProjectConcept {

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
    fileHash?: string;
  }): Promise<{ project: Project } | { error: string }> {
    try {
      // Validate required fields
      if (!input.title || !input.description) {
        return { error: "Title and description are required" };
      }

      const project = await prisma.project.create({
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
          fileHash: input.fileHash,
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

      const project = await prisma.project.update({
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
  }): Promise<{ project: Project; wasExisting?: boolean } | { error: string }> {
    try {
      // Generate file hash for deduplication
      input.onProgress?.('Computing file hash', 5);
      const crypto = require('crypto');
      const fileHash = crypto.createHash('sha256').update(input.fileBuffer).digest('hex');
      
      // Check if we already have a project for this file hash
      input.onProgress?.('Checking for existing project', 10);
      const existingProjects = await this._getByFileHash({ fileHash });
      
      if (existingProjects.length > 0) {
        const existingProject = existingProjects[0];
        console.log(`Found existing project for file hash: ${fileHash}, project: ${existingProject.title}`);
        
        // Ensure this project has a relationship with the current organization
        input.onProgress?.('Linking existing project to organization', 90);
        const relationshipResult = await this.ensureProjectOrganizationRelationship({
          projectId: existingProject.id,
          organizationId: input.organizationId
        });
        
        if ('error' in relationshipResult) {
          console.warn('Failed to create relationship with organization:', relationshipResult.error);
        }
        
        input.onProgress?.('Project already exists and linked', 100);
        return { project: existingProject, wasExisting: true };
      }

      // Extract project data from document using AI
      input.onProgress?.('Starting AI extraction', 15);
      const extractedData = await projectExtractionService.extractFromDocument(
        input.fileBuffer,
        input.originalFilename,
        input.organizationId,
        input.quality || 'medium',
        (stage: string, progress: number) => {
          // Map AI extraction progress to 15-75 range
          const mappedProgress = 15 + (progress * 0.6);
          input.onProgress?.(stage, mappedProgress);
        }
      );

      // Generate project image
      input.onProgress?.('Generating project image', 80);
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
      input.onProgress?.('Creating project record', 90);
      const project = await prisma.project.create({
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
          fileHash: fileHash, // Store the file hash
          sourceData: {
            originalFilename: input.originalFilename,
            extractedAt: new Date().toISOString(),
            imagePrompt: extractedData.imagePrompt,
            fileHash: fileHash
          }
        }
      });

      // Create relationship between project and organization
      input.onProgress?.('Linking project to organization', 95);
      try {
        await prisma.relationship.create({
          data: {
            fromEntityType: 'project',
            fromEntityId: project.id,
            toEntityType: 'organization',
            toEntityId: input.organizationId,
            relationType: 'child', // Changed from 'child' to 'belongs_to' for consistency
            metadata: {
              createdBy: 'ai_extraction',
              sourceFile: input.originalFilename,
              fileHash: fileHash
            }
          }
        });
      } catch (relationshipError) {
        console.warn('Failed to create project-organization relationship:', relationshipError);
        // Continue without failing the whole operation
      }

      input.onProgress?.('Project created successfully', 100);
      return { project, wasExisting: false };
    } catch (error) {
      return { error: `Failed to extract project from document: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      await prisma.project.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete project: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Project | null> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: input.id }
      });
      return project;
    } catch {
      return null;
    }
  }

  async _getByIds(input: { id: string[] }): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { id: { in: input.id } }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByIndustry(input: { industry: string }): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { industry: input.industry }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByDomain(input: { domain: string }): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { domain: input.domain }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByDifficulty(input: { difficulty: string }): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { difficulty: input.difficulty }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { status: input.status }
      });
      return projects;
    } catch {
      return [];
    }
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
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
      const projects = await prisma.project.findMany({
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
      const relationships = await prisma.relationship.findMany({
        where: {
          fromEntityType: 'project',
          toEntityType: 'organization',
          toEntityId: input.organizationId,
          relationType: 'child'
        }
      });

      const projectIds = relationships.map(rel => rel.fromEntityId);

      if (projectIds.length === 0) {
        return [];
      }

      // Get the actual projects
      const projects = await prisma.project.findMany({
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

  async _getByOrganizationPaginated(input: { 
    organizationId: string;
    skip?: number;
    take?: number;
    filters?: {
      industry?: string;
      domain?: string;
      status?: string;
      difficulty?: string;
    };
  }): Promise<{ projects: Project[]; total: number; hasMore: boolean }> {
    try {
      // Get project IDs that belong to the organization via relationships
      const relationships = await prisma.relationship.findMany({
        where: {
          fromEntityType: 'project',
          toEntityType: 'organization',
          toEntityId: input.organizationId,
          relationType: 'child'
        }
      });

      const projectIds = relationships.map(rel => rel.fromEntityId);

      if (projectIds.length === 0) {
        return { projects: [], total: 0, hasMore: false };
      }

      // Build filter conditions
      const where: any = {
        id: { in: projectIds }
      };

      if (input.filters) {
        if (input.filters.industry) {
          where.industry = { contains: input.filters.industry, mode: 'insensitive' };
        }
        if (input.filters.domain) {
          where.domain = { contains: input.filters.domain, mode: 'insensitive' };
        }
        if (input.filters.status) {
          where.status = input.filters.status;
        }
        if (input.filters.difficulty) {
          where.difficulty = input.filters.difficulty;
        }
      }

      // Get total count
      const total = await prisma.project.count({ where });

      // Get paginated projects
      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: input.skip || 0,
        take: input.take || 20
      });

      const hasMore = (input.skip || 0) + projects.length < total;

      return { projects, total, hasMore };
    } catch {
      return { projects: [], total: 0, hasMore: false };
    }
  }

  async _getIndustryCountByOrganization(input: { organizationId: string }): Promise<{ industry: string, count: number }[]> {
    try {
      // Get project IDs that belong to the organization via relationships
      const relationships = await prisma.relationship.findMany({
        where: {
          fromEntityType: 'project',
          toEntityType: 'organization',
          toEntityId: input.organizationId,
          relationType: 'child'
        }
      });

      const projectIds = relationships.map(rel => rel.fromEntityId);

      if (projectIds.length === 0) {
        return [];
      }
      
      const projects = await prisma.project.groupBy({
        by: ['industry'],
        where: { id: { in: projectIds } },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc', // Most projects first
          },
        },
      });
      console.log("Projects", projects);
      return projects.map(project => ({
        industry: project.industry,
        count: project._count.id
      }));
    } catch {
      return [];
    }
  }


  async _getByFileHash(input: { fileHash: string }): Promise<Project[]> {
    try {
      const project = await prisma.project.findUnique({
        where: { fileHash: input.fileHash }
      });
      return project ? [project] : [];
    } catch {
      return [];
    }
  }

  async ensureProjectOrganizationRelationship(input: {
    projectId: string;
    organizationId: string;
  }): Promise<{ success: boolean; relationship?: any } | { error: string }> {
    try {
      // Check if relationship already exists
      const existingRelationship = await prisma.relationship.findFirst({
        where: {
          fromEntityType: 'project',
          fromEntityId: input.projectId,
          toEntityType: 'organization',
          toEntityId: input.organizationId,
          relationType: 'child'
        }
      });

      if (existingRelationship) {
        return { success: true, relationship: existingRelationship };
      }

      // Create the relationship
      const relationship = await prisma.relationship.create({
        data: {
          fromEntityType: 'project',
          fromEntityId: input.projectId,
          toEntityType: 'organization',
          toEntityId: input.organizationId,
          relationType: 'child',
          metadata: {
            addedAt: new Date().toISOString(),
            reason: 'file_upload_association'
          }
        }
      });

      return { success: true, relationship };
    } catch (error) {
      return { error: `Failed to create project-organization relationship: ${error}` };
    }
  }
}