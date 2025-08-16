/**
 * Simple test to verify project creation works
 * This test is designed to run quickly and verify basic functionality
 */

// Mock the Prisma client first, before importing anything else
jest.mock('@prisma/client', () => {
  const mockProject = {
    id: 'test-id-123',
    project: 'test-project-id',
    title: 'Test Project',
    description: 'A test project',
    scope: 'Test scope',
    industry: 'Technology',
    domain: 'Software Development',
    difficulty: 'beginner',
    estimatedHours: 10,
    deliverables: ['Test deliverable'],
    status: 'active',
    aiGenerated: false,
    image: null,
    templateType: null,
    sourceData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      project: {
        create: jest.fn().mockResolvedValue(mockProject),
        findFirst: jest.fn().mockResolvedValue(null), // No existing project
        update: jest.fn().mockResolvedValue(mockProject),
        delete: jest.fn().mockResolvedValue(mockProject),
        findUnique: jest.fn().mockResolvedValue(mockProject),
        findMany: jest.fn().mockResolvedValue([mockProject]),
      },
    })),
  };
});

import { ProjectConcept } from '../lib/concepts/project/project';

describe('Simple Project Creation Test', () => {
  let projectConcept: ProjectConcept;

  beforeEach(() => {
    projectConcept = new ProjectConcept();
    jest.clearAllMocks();
  });

  test('should create a basic project', async () => {
    const input = {
      project: 'test-project-123',
      title: 'Basic Test Project',
      description: 'A simple project for testing',
      scope: 'Basic testing scope',
      industry: 'Technology',
      domain: 'Software Development',
      difficulty: 'beginner',
      estimatedHours: 10,
      deliverables: ['Basic deliverable'],
      image: null,
    };

    const result = await projectConcept.create(input);

    expect(result).toHaveProperty('project');
    if ('project' in result) {
      expect(result.project.title).toBe('Test Project'); // From mock
      expect(result.project.status).toBe('active');
      expect(result.project.aiGenerated).toBe(false);
    }
  });

  test('should handle validation errors', async () => {
    const invalidInput = {
      project: '',
      title: '',
      description: '',
      scope: 'Test scope',
      industry: 'Technology',
      domain: 'Software Development',
      difficulty: 'beginner',
      estimatedHours: 10,
      deliverables: ['Test deliverable'],
      image: null,
    };

    const result = await projectConcept.create(invalidInput);

    expect(result).toHaveProperty('error');
  });

  test('should query projects by industry', async () => {
    const projects = await projectConcept._getByIndustry({ industry: 'Technology' });
    
    expect(Array.isArray(projects)).toBe(true);
    expect(projects).toHaveLength(1);
    expect(projects[0].industry).toBe('Technology');
  });

  test('should search projects by keywords', async () => {
    const projects = await projectConcept._searchByKeywords({ keywords: ['test'] });
    
    expect(Array.isArray(projects)).toBe(true);
    expect(projects).toHaveLength(1);
  });
});

console.log('✅ Simple project test loaded successfully');
export {};
