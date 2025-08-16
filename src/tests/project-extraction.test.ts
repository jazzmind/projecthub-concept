import { ProjectConcept } from '../lib/concepts/project/project';
import { projectExtractionService } from '../lib/ai/projectExtractionService';

// Mock Prisma client to avoid database calls during testing
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    project: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock the AI service to avoid actual API calls during testing
jest.mock('../lib/ai/projectExtractionService', () => ({
  projectExtractionService: {
    extractFromDocument: jest.fn(),
    generateProjectImage: jest.fn(),
  },
}));

// Mock uuid to get predictable IDs in tests
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

const mockExtractedData = {
  title: 'Test Project: Digital Marketing Campaign Analysis',
  description: 'Students will analyze digital marketing campaign effectiveness by examining key performance indicators, audience engagement metrics, and conversion rates. This project focuses on understanding how different marketing strategies impact business outcomes through data-driven analysis.',
  scope: 'Includes: Analysis of campaign data, creation of performance dashboards, identification of optimization opportunities. Excludes: Running actual campaigns, access to proprietary company data.',
  industry: 'Marketing',
  domain: 'Data Analysis',
  difficulty: 'intermediate' as const,
  estimatedHours: 20,
  deliverables: [
    'Campaign performance analysis report (8-10 pages)',
    'Interactive dashboard with key metrics',
    'Optimization recommendations presentation',
    'Executive summary with actionable insights'
  ],
  imagePrompt: 'Modern data visualization dashboard showing marketing campaign analytics with charts, graphs, and performance metrics'
};

const mockImageUrl = 'https://example.com/generated-image.png';

describe('Project Extraction and Creation', () => {
  let projectConcept: ProjectConcept;
  let mockPrismaCreate: jest.Mock;

  beforeEach(() => {
    projectConcept = new ProjectConcept();
    jest.clearAllMocks();
    
    // Setup Prisma mocks
    mockPrismaCreate = jest.fn().mockResolvedValue({
      id: 'db-id-123',
      project: 'project-test-uuid-123',
      title: mockExtractedData.title,
      description: mockExtractedData.description,
      scope: mockExtractedData.scope,
      industry: mockExtractedData.industry,
      domain: mockExtractedData.domain,
      difficulty: mockExtractedData.difficulty,
      estimatedHours: mockExtractedData.estimatedHours,
      deliverables: mockExtractedData.deliverables,
      status: 'draft',
      aiGenerated: true,
      image: mockImageUrl,
      sourceData: {
        originalFilename: 'test-project.docx',
        extractedAt: expect.any(String),
        imagePrompt: mockExtractedData.imagePrompt
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Mock the Prisma client methods
    (projectConcept as any).prisma = {
      project: {
        create: mockPrismaCreate,
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };
    
    // Setup default AI service mocks
    (projectExtractionService.extractFromDocument as jest.Mock).mockResolvedValue(mockExtractedData);
    (projectExtractionService.generateProjectImage as jest.Mock).mockResolvedValue(mockImageUrl);
  });

  describe('Project Creation from Extracted Data', () => {
    test('should create project with all required fields', async () => {
      const input = {
        fileBuffer: Buffer.from('test document content'),
        originalFilename: 'test-project.docx',
        organizationId: 'org-123',
        quality: 'medium' as const,
      };

      const result = await projectConcept.extractFromDocument(input);

      expect(result).toHaveProperty('project');
      if ('project' in result) {
        expect(result.project.title).toBe(mockExtractedData.title);
        expect(result.project.description).toBe(mockExtractedData.description);
        expect(result.project.scope).toBe(mockExtractedData.scope);
        expect(result.project.industry).toBe(mockExtractedData.industry);
        expect(result.project.domain).toBe(mockExtractedData.domain);
        expect(result.project.difficulty).toBe(mockExtractedData.difficulty);
        expect(result.project.estimatedHours).toBe(mockExtractedData.estimatedHours);
        expect(result.project.deliverables).toEqual(mockExtractedData.deliverables);
        expect(result.project.status).toBe('draft');
        expect(result.project.aiGenerated).toBe(true);
        expect(result.project.image).toBe(mockImageUrl);
      }
    });

    test('should handle image generation failure gracefully', async () => {
      // Mock image generation to fail
      (projectExtractionService.generateProjectImage as jest.Mock).mockRejectedValue(
        new Error('Image generation failed')
      );

      const input = {
        fileBuffer: Buffer.from('test document content'),
        originalFilename: 'test-project.docx',
        organizationId: 'org-123',
        quality: 'medium' as const,
      };

      const result = await projectConcept.extractFromDocument(input);

      expect(result).toHaveProperty('project');
      if ('project' in result) {
        expect(result.project.image).toBeNull();
        expect(result.project.title).toBe(mockExtractedData.title);
      }
    });

    test('should include source metadata', async () => {
      const input = {
        fileBuffer: Buffer.from('test document content'),
        originalFilename: 'marketing-brief.docx',
        organizationId: 'org-456',
        quality: 'high' as const,
      };

      const result = await projectConcept.extractFromDocument(input);

      expect(result).toHaveProperty('project');
      if ('project' in result) {
        expect(result.project.sourceData).toMatchObject({
          originalFilename: 'marketing-brief.docx',
          imagePrompt: mockExtractedData.imagePrompt,
        });
        expect(result.project.sourceData).toHaveProperty('extractedAt');
      }
    });

    test('should handle AI extraction failure', async () => {
      // Mock AI extraction to fail
      (projectExtractionService.extractFromDocument as jest.Mock).mockRejectedValue(
        new Error('AI extraction failed')
      );

      const input = {
        fileBuffer: Buffer.from('test document content'),
        originalFilename: 'test-project.docx',
        organizationId: 'org-123',
        quality: 'medium' as const,
      };

      const result = await projectConcept.extractFromDocument(input);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Failed to extract project from document');
      }
    });

    test('should pass quality parameter to AI service', async () => {
      const input = {
        fileBuffer: Buffer.from('test document content'),
        originalFilename: 'test-project.docx',
        organizationId: 'org-123',
        quality: 'high' as const,
      };

      await projectConcept.extractFromDocument(input);

      expect(projectExtractionService.extractFromDocument).toHaveBeenCalledWith(
        input.fileBuffer,
        input.originalFilename,
        input.organizationId,
        'high',
        expect.any(Function) // onProgress callback
      );
    });

    test('should call progress callback during extraction', async () => {
      const progressCallback = jest.fn();
      const input = {
        fileBuffer: Buffer.from('test document content'),
        originalFilename: 'test-project.docx',
        organizationId: 'org-123',
        quality: 'medium' as const,
        onProgress: progressCallback,
      };

      await projectConcept.extractFromDocument(input);

      expect(progressCallback).toHaveBeenCalledWith('Starting AI extraction', 0);
      expect(progressCallback).toHaveBeenCalledWith('Generating project image', 85);
      expect(progressCallback).toHaveBeenCalledWith('Creating project record', 95);
      expect(progressCallback).toHaveBeenCalledWith('Project created successfully', 100);
    });
  });

  describe('Project Field Validation', () => {
    test('should create project with minimum required fields', async () => {
      const minimalData = {
        title: 'Minimal Test Project',
        description: 'Basic project description',
        scope: 'Test scope',
        industry: 'Technology',
        domain: 'Software Development',
        difficulty: 'beginner' as const,
        estimatedHours: 10,
        deliverables: ['Basic deliverable'],
        imagePrompt: 'Simple project illustration'
      };

      (projectExtractionService.extractFromDocument as jest.Mock).mockResolvedValue(minimalData);
      (projectExtractionService.generateProjectImage as jest.Mock).mockResolvedValue(null);

      const input = {
        fileBuffer: Buffer.from('minimal content'),
        originalFilename: 'minimal.docx',
        organizationId: 'org-test',
        quality: 'low' as const,
      };

      const result = await projectConcept.extractFromDocument(input);

      expect(result).toHaveProperty('project');
      if ('project' in result) {
        expect(result.project.title).toBe(minimalData.title);
        expect(result.project.estimatedHours).toBe(minimalData.estimatedHours);
        expect(result.project.deliverables).toEqual(minimalData.deliverables);
      }
    });

    test('should handle different difficulty levels', async () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'] as const;

      for (const difficulty of difficulties) {
        const data = { ...mockExtractedData, difficulty };
        (projectExtractionService.extractFromDocument as jest.Mock).mockResolvedValue(data);

        const input = {
          fileBuffer: Buffer.from('test content'),
          originalFilename: `${difficulty}-project.docx`,
          organizationId: 'org-test',
          quality: 'medium' as const,
        };

        const result = await projectConcept.extractFromDocument(input);

        expect(result).toHaveProperty('project');
        if ('project' in result) {
          expect(result.project.difficulty).toBe(difficulty);
        }
      }
    });

    test('should handle various estimated hours ranges', async () => {
      const hourRanges = [5, 20, 50, 100];

      for (const hours of hourRanges) {
        const data = { ...mockExtractedData, estimatedHours: hours };
        (projectExtractionService.extractFromDocument as jest.Mock).mockResolvedValue(data);

        const input = {
          fileBuffer: Buffer.from('test content'),
          originalFilename: `${hours}h-project.docx`,
          organizationId: 'org-test',
          quality: 'medium' as const,
        };

        const result = await projectConcept.extractFromDocument(input);

        expect(result).toHaveProperty('project');
        if ('project' in result) {
          expect(result.project.estimatedHours).toBe(hours);
        }
      }
    });
  });

  describe('Database Integration', () => {
    test('should generate unique project identifiers', async () => {
      const input = {
        fileBuffer: Buffer.from('test content'),
        originalFilename: 'test.docx',
        organizationId: 'org-test',
        quality: 'medium' as const,
      };

      const result1 = await projectConcept.extractFromDocument(input);
      const result2 = await projectConcept.extractFromDocument(input);

      expect(result1).toHaveProperty('project');
      expect(result2).toHaveProperty('project');
      
      if ('project' in result1 && 'project' in result2) {
        expect(result1.project.project).not.toBe(result2.project.project);
        expect(result1.project.project).toMatch(/^project-[a-f0-9-]+$/);
        expect(result2.project.project).toMatch(/^project-[a-f0-9-]+$/);
      }
    });

    test('should set proper timestamps', async () => {
      const beforeTime = new Date();
      
      const input = {
        fileBuffer: Buffer.from('test content'),
        originalFilename: 'test.docx',
        organizationId: 'org-test',
        quality: 'medium' as const,
      };

      const result = await projectConcept.extractFromDocument(input);
      const afterTime = new Date();

      expect(result).toHaveProperty('project');
      if ('project' in result) {
        const projectTime = new Date(result.project.createdAt);
        expect(projectTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(projectTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });
});

describe('Manual Project Creation Tests', () => {
  let projectConcept: ProjectConcept;

  beforeEach(() => {
    projectConcept = new ProjectConcept();
  });

  test('should create project via regular create method', async () => {
    const input = {
      project: 'manual-test-project',
      title: 'Manual Test Project',
      description: 'A project created for testing purposes',
      scope: 'Testing project creation functionality',
      industry: 'Technology',
      domain: 'Software Testing',
      difficulty: 'intermediate',
      estimatedHours: 15,
      deliverables: ['Test results', 'Bug reports'],
      image: 'https://example.com/test-image.png',
    };

    const result = await projectConcept.create(input);

    expect(result).toHaveProperty('project');
    if ('project' in result) {
      expect(result.project.title).toBe(input.title);
      expect(result.project.status).toBe('active');
      expect(result.project.aiGenerated).toBe(false);
    }
  });
});
