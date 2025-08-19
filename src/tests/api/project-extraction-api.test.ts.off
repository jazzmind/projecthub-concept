import { POST } from '../../app/api/projects/extract/route';
import { ProjectConcept } from '../../lib/concepts/project/project';

// Mock the ProjectConcept
jest.mock('../../lib/concepts/project/project');

const mockProject = {
  id: 'test-project-id',
  project: 'project-test-123',
  title: 'Test AI Extracted Project',
  description: 'A project extracted from a test document',
  scope: 'Test scope for validation',
  industry: 'Technology',
  domain: 'Software Development',
  difficulty: 'intermediate',
  estimatedHours: 25,
  deliverables: ['Test deliverable 1', 'Test deliverable 2'],
  status: 'draft',
  aiGenerated: true,
  image: 'https://example.com/test-image.png',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Project Extraction API', () => {
  let mockExtractFromDocument: jest.Mock;

  beforeEach(() => {
    mockExtractFromDocument = jest.fn();
    (ProjectConcept as jest.Mock).mockImplementation(() => ({
      extractFromDocument: mockExtractFromDocument,
    }));
    jest.clearAllMocks();
  });

  describe('POST /api/projects/extract', () => {
    test('should successfully extract project from valid request', async () => {
      mockExtractFromDocument.mockResolvedValue({ project: mockProject });

      const requestBody = {
        fileBuffer: [72, 101, 108, 108, 111], // "Hello" as byte array
        originalFilename: 'test-document.docx',
        organizationId: 'org-123',
        quality: 'medium',
      };

      const request = new Request('http://localhost/api/projects/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('project');
      expect(data.project.title).toBe(mockProject.title);
      expect(mockExtractFromDocument).toHaveBeenCalledWith({
        fileBuffer: expect.any(Buffer),
        originalFilename: 'test-document.docx',
        organizationId: 'org-123',
        quality: 'medium',
      });
    });

    test('should handle extraction errors', async () => {
      mockExtractFromDocument.mockResolvedValue({ 
        error: 'Failed to extract project data' 
      });

      const requestBody = {
        fileBuffer: [72, 101, 108, 108, 111],
        originalFilename: 'invalid-document.docx',
        organizationId: 'org-123',
        quality: 'medium',
      };

      const request = new Request('http://localhost/api/projects/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Failed to extract project data');
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        { fileBuffer: [], originalFilename: '', organizationId: 'org-123' }, // empty filename
        { fileBuffer: [], originalFilename: 'test.docx', organizationId: '' }, // empty org ID
        { originalFilename: 'test.docx', organizationId: 'org-123' }, // missing fileBuffer
      ];

      for (const requestBody of invalidRequests) {
        const request = new Request('http://localhost/api/projects/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error');
        expect(data.error).toContain('Invalid request');
      }
    });

    test('should handle different quality levels', async () => {
      const qualities = ['low', 'medium', 'high'] as const;

      for (const quality of qualities) {
        mockExtractFromDocument.mockResolvedValue({ project: mockProject });

        const requestBody = {
          fileBuffer: [72, 101, 108, 108, 111],
          originalFilename: 'test-document.docx',
          organizationId: 'org-123',
          quality,
        };

        const request = new Request('http://localhost/api/projects/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(mockExtractFromDocument).toHaveBeenCalledWith(
          expect.objectContaining({ quality })
        );
      }
    });

    test('should default to medium quality when not specified', async () => {
      mockExtractFromDocument.mockResolvedValue({ project: mockProject });

      const requestBody = {
        fileBuffer: [72, 101, 108, 108, 111],
        originalFilename: 'test-document.docx',
        organizationId: 'org-123',
        // quality not specified
      };

      const request = new Request('http://localhost/api/projects/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockExtractFromDocument).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 'medium' })
      );
    });

    test('should handle concept extraction throwing errors', async () => {
      mockExtractFromDocument.mockRejectedValue(new Error('Database connection failed'));

      const requestBody = {
        fileBuffer: [72, 101, 108, 108, 111],
        originalFilename: 'test-document.docx',
        organizationId: 'org-123',
        quality: 'medium',
      };

      const request = new Request('http://localhost/api/projects/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Internal server error during project extraction');
    });

    test('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/projects/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    test('should convert file buffer array back to Buffer correctly', async () => {
      const originalText = 'Test document content';
      const bufferArray = Array.from(Buffer.from(originalText));
      
      mockExtractFromDocument.mockImplementation((input) => {
        // Verify the buffer was reconstructed correctly
        const reconstructedText = input.fileBuffer.toString();
        expect(reconstructedText).toBe(originalText);
        return Promise.resolve({ project: mockProject });
      });

      const requestBody = {
        fileBuffer: bufferArray,
        originalFilename: 'test-document.docx',
        organizationId: 'org-123',
        quality: 'medium',
      };

      const request = new Request('http://localhost/api/projects/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });
});
