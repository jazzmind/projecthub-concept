/**
 * Test project-organization relationships
 */

// Mock Prisma first, before importing anything else
jest.mock('@prisma/client', () => {
  const mockProject = {
    id: 'project-123',
    title: 'Test Project: Digital Marketing Campaign Analysis',
    description: 'Students will analyze digital marketing campaign effectiveness',
    scope: 'Analysis of campaign data, creation of dashboards',
    industry: 'Technology',
    domain: 'Digital Marketing',
    difficulty: 'intermediate',
    estimatedHours: 25,
    deliverables: ['Performance dashboard', 'Analysis report'],
    status: 'draft',
    aiGenerated: true,
    image: 'https://example.com/test-image.png',
    templateType: null,
    sourceData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelationship = {
    id: 'rel-123',
    fromEntityType: 'project',
    fromEntityId: 'project-123',
    toEntityType: 'organization',
    toEntityId: 'org-456',
    relationType: 'child',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      project: {
        create: jest.fn().mockResolvedValue(mockProject),
        findMany: jest.fn().mockResolvedValue([mockProject]),
      },
      relationship: {
        create: jest.fn().mockResolvedValue(mockRelationship),
        findMany: jest.fn().mockResolvedValue([mockRelationship]),
      },
    })),
  };
});

import { ProjectConcept } from '../lib/concepts/project/project';

describe('Project-Organization Relationships', () => {
  let projectConcept: ProjectConcept;
  let mockPrismaCreate: jest.Mock;
  let mockRelationshipCreate: jest.Mock;
  let mockRelationshipFindMany: jest.Mock;

  beforeEach(() => {
    projectConcept = new ProjectConcept();
    jest.clearAllMocks();
    
    // Setup Prisma mocks
    mockPrismaCreate = jest.fn().mockResolvedValue({
      id: 'project-123',
      title: 'Test Project',
      description: 'A test project',
      scope: 'Test scope',
      industry: 'Technology',
      domain: 'Software Development',
      difficulty: 'intermediate',
      estimatedHours: 25,
      deliverables: ['Test deliverable'],
      status: 'draft',
      aiGenerated: true,
      image: 'https://example.com/test-image.png',
      sourceData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRelationshipCreate = jest.fn().mockResolvedValue({
      id: 'rel-123',
      fromEntityType: 'project',
      fromEntityId: 'project-123',
      toEntityType: 'organization',
      toEntityId: 'org-456',
      relationType: 'child',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRelationshipFindMany = jest.fn().mockResolvedValue([{
      fromEntityId: 'project-123',
      toEntityId: 'org-456'
    }]);
    
    // Mock the Prisma client methods
    (projectConcept as any).prisma = {
      project: {
        create: mockPrismaCreate,
        findMany: jest.fn().mockResolvedValue([{
          id: 'project-123',
          title: 'Test Project',
          // ... other fields
        }]),
      },
      relationship: {
        create: mockRelationshipCreate,
        findMany: mockRelationshipFindMany,
      },
    };
  });

  test('should create project-organization relationship during extraction', async () => {
    const input = {
      fileBuffer: Buffer.from('test document content'),
      originalFilename: 'test-project.docx',
      organizationId: 'org-456',
      quality: 'medium' as const,
      onProgress: jest.fn(),
    };

    // Mock AI service to return valid data
    const mockExtractionService = require('../lib/ai/projectExtractionService');
    mockExtractionService.projectExtractionService = {
      extractFromDocument: jest.fn().mockResolvedValue({
        title: 'Test Project',
        description: 'A test project description',
        scope: 'Test scope',
        industry: 'Technology',
        domain: 'Software Development',
        difficulty: 'intermediate',
        estimatedHours: 25,
        deliverables: ['Test deliverable'],
        imagePrompt: 'Test image prompt',
      }),
      generateProjectImage: jest.fn().mockResolvedValue('https://example.com/test-image.png'),
    };

    const result = await projectConcept.extractFromDocument(input);

    expect(result).toHaveProperty('project');
    if ('project' in result) {
      expect(result.project.id).toBe('project-123');
    }

    // Verify relationship creation was attempted
    expect(mockRelationshipCreate).toHaveBeenCalledWith({
      data: {
        fromEntityType: 'project',
        fromEntityId: 'project-123',
        toEntityType: 'organization',
        toEntityId: 'org-456',
        relationType: 'child',
        metadata: {
          createdBy: 'ai_extraction',
          sourceFile: 'test-project.docx'
        }
      }
    });
  });

  test('should retrieve projects by organization', async () => {
    const result = await projectConcept._getByOrganization({ organizationId: 'org-456' });

    expect(Array.isArray(result)).toBe(true);
    expect(mockRelationshipFindMany).toHaveBeenCalledWith({
      where: {
        fromEntityType: 'project',
        toEntityType: 'organization',
        toEntityId: 'org-456',
        relationType: 'child'
      }
    });
  });
});

console.log('✅ Project relationship test loaded successfully');
export {};
