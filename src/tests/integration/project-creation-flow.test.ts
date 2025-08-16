import { ProjectConcept } from '../../lib/concepts/project/project';

/**
 * Integration tests for the complete project creation flow
 * These tests use real database operations but mock external AI services
 */

// Sample extracted project data that would come from AI
const sampleExtractedProjects = [
  {
    title: 'E-commerce Analytics Dashboard Development',
    description: 'Students will design and build a comprehensive analytics dashboard for an e-commerce platform, focusing on key performance indicators such as conversion rates, customer acquisition costs, and revenue metrics. This project emphasizes data visualization, user experience design, and business intelligence concepts.',
    scope: 'Includes: Frontend dashboard development, data integration from mock APIs, responsive design implementation, basic user authentication. Excludes: Backend database design, payment processing, real customer data access.',
    industry: 'E-commerce',
    domain: 'Web Development',
    difficulty: 'intermediate' as const,
    estimatedHours: 35,
    deliverables: [
      'Interactive web dashboard with responsive design',
      'Documentation of data sources and metrics',
      'User guide for dashboard navigation',
      'Performance optimization report',
      'Testing strategy and results'
    ],
    imagePrompt: 'Modern web dashboard with charts, graphs, and analytics widgets showing e-commerce metrics'
  },
  {
    title: 'Sustainable Supply Chain Analysis',
    description: 'An investigation into sustainable practices within global supply chains, examining environmental impact, ethical sourcing, and cost-benefit analysis of green alternatives. Students will develop frameworks for evaluating sustainability metrics and create actionable recommendations.',
    scope: 'Includes: Research methodology design, data collection from public sources, sustainability framework development, case study analysis. Excludes: Primary company interviews, proprietary supply chain data, financial modeling software.',
    industry: 'Sustainability',
    domain: 'Business Analysis',
    difficulty: 'advanced' as const,
    estimatedHours: 45,
    deliverables: [
      'Comprehensive research report (15-20 pages)',
      'Sustainability assessment framework',
      'Case study analysis (3 companies)',
      'Recommendation presentation',
      'Implementation roadmap'
    ],
    imagePrompt: 'Infographic showing sustainable supply chain with green transportation, renewable energy, and eco-friendly packaging'
  },
  {
    title: 'Mobile App Prototype for Student Wellness',
    description: 'Design and prototype a mobile application focused on student mental health and wellness. This project covers user research, interface design, prototype development, and usability testing to create a solution that addresses real student needs.',
    scope: 'Includes: User persona development, wireframing, interactive prototype creation, usability testing with peers, design iteration. Excludes: Native app development, backend infrastructure, clinical advice features.',
    industry: 'Healthcare',
    domain: 'UX/UI Design',
    difficulty: 'beginner' as const,
    estimatedHours: 25,
    deliverables: [
      'User research summary and personas',
      'Wireframes and user flow diagrams',
      'Interactive clickable prototype',
      'Usability testing report',
      'Final design presentation'
    ],
    imagePrompt: 'Mobile app interface mockup showing wellness features with calming colors, mindfulness icons, and student-friendly design'
  }
];

describe('Project Creation Integration Tests', () => {
  let projectConcept: ProjectConcept;

  beforeEach(() => {
    projectConcept = new ProjectConcept();
  });

  describe('Direct Project Creation', () => {
    test('should create and save projects with different characteristics', async () => {
      const createdProjects = [];

      for (const [index, projectData] of sampleExtractedProjects.entries()) {
        const result = await projectConcept.create({
          project: `integration-test-${index + 1}`,
          title: projectData.title,
          description: projectData.description,
          scope: projectData.scope,
          industry: projectData.industry,
          domain: projectData.domain,
          difficulty: projectData.difficulty,
          estimatedHours: projectData.estimatedHours,
          deliverables: projectData.deliverables,
          image: null, // No image for direct creation
        });

        expect(result).toHaveProperty('project');
        if ('project' in result) {
          createdProjects.push(result.project);
          
          // Verify all fields are saved correctly
          expect(result.project.title).toBe(projectData.title);
          expect(result.project.industry).toBe(projectData.industry);
          expect(result.project.difficulty).toBe(projectData.difficulty);
          expect(result.project.estimatedHours).toBe(projectData.estimatedHours);
          expect(result.project.deliverables).toEqual(projectData.deliverables);
          expect(result.project.status).toBe('active');
          expect(result.project.aiGenerated).toBe(false);
        }
      }

      expect(createdProjects).toHaveLength(3);
    });

    test('should handle projects with different difficulty levels', async () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
      const createdProjects = [];

      for (const [index, difficulty] of difficulties.entries()) {
        const projectData = sampleExtractedProjects.find(p => p.difficulty === difficulty)!;
        
        const result = await projectConcept.create({
          project: `difficulty-test-${difficulty}`,
          title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level Project`,
          description: projectData.description,
          scope: projectData.scope,
          industry: projectData.industry,
          domain: projectData.domain,
          difficulty: difficulty,
          estimatedHours: projectData.estimatedHours,
          deliverables: projectData.deliverables,
          image: null,
        });

        expect(result).toHaveProperty('project');
        if ('project' in result) {
          createdProjects.push(result.project);
          expect(result.project.difficulty).toBe(difficulty);
        }
      }

      expect(createdProjects).toHaveLength(3);
      expect(createdProjects.map(p => p.difficulty)).toEqual(difficulties);
    });

    test('should validate required fields', async () => {
      const invalidInputs = [
        { project: '', title: 'Test', description: 'Test' }, // empty project ID
        { project: 'test', title: '', description: 'Test' }, // empty title
        { project: 'test', title: 'Test', description: '' }, // empty description
      ];

      for (const input of invalidInputs) {
        const result = await projectConcept.create({
          ...input,
          scope: 'Test scope',
          industry: 'Technology',
          domain: 'Software',
          difficulty: 'beginner',
          estimatedHours: 10,
          deliverables: ['Test deliverable'],
          image: null,
        } as any);

        expect(result).toHaveProperty('error');
      }
    });
  });

  describe('Project Queries and Retrieval', () => {
    beforeEach(async () => {
      // Create test projects for querying
      for (const [index, projectData] of sampleExtractedProjects.entries()) {
        await projectConcept.create({
          project: `query-test-${index + 1}`,
          title: projectData.title,
          description: projectData.description,
          scope: projectData.scope,
          industry: projectData.industry,
          domain: projectData.domain,
          difficulty: projectData.difficulty,
          estimatedHours: projectData.estimatedHours,
          deliverables: projectData.deliverables,
          image: null,
        });
      }
    });

    test('should retrieve projects by industry', async () => {
      const ecommerceProjects = await projectConcept._getByIndustry({ 
        industry: 'E-commerce' 
      });
      
      expect(ecommerceProjects.length).toBeGreaterThan(0);
      expect(ecommerceProjects[0].industry).toBe('E-commerce');
    });

    test('should retrieve projects by domain', async () => {
      const webDevProjects = await projectConcept._getByDomain({ 
        domain: 'Web Development' 
      });
      
      expect(webDevProjects.length).toBeGreaterThan(0);
      expect(webDevProjects[0].domain).toBe('Web Development');
    });

    test('should retrieve projects by difficulty', async () => {
      const intermediateProjects = await projectConcept._getByDifficulty({ 
        difficulty: 'intermediate' 
      });
      
      expect(intermediateProjects.length).toBeGreaterThan(0);
      expect(intermediateProjects[0].difficulty).toBe('intermediate');
    });

    test('should search projects by keywords', async () => {
      const dashboardProjects = await projectConcept._searchByKeywords({ 
        keywords: ['dashboard', 'analytics'] 
      });
      
      expect(dashboardProjects.length).toBeGreaterThan(0);
      expect(
        dashboardProjects.some(p => 
          p.title.toLowerCase().includes('dashboard') || 
          p.description.toLowerCase().includes('analytics')
        )
      ).toBe(true);
    });

    test('should filter projects by estimated hours range', async () => {
      const shortProjects = await projectConcept._getByEstimatedHours({ 
        minHours: 20, 
        maxHours: 30 
      });
      
      expect(shortProjects.length).toBeGreaterThan(0);
      shortProjects.forEach(project => {
        expect(project.estimatedHours).toBeGreaterThanOrEqual(20);
        expect(project.estimatedHours).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('Project Lifecycle Operations', () => {
    let testProjectId: string;

    beforeEach(async () => {
      const result = await projectConcept.create({
        project: 'lifecycle-test',
        title: 'Lifecycle Test Project',
        description: 'A project for testing lifecycle operations',
        scope: 'Testing project lifecycle',
        industry: 'Technology',
        domain: 'Software Testing',
        difficulty: 'intermediate',
        estimatedHours: 20,
        deliverables: ['Test results'],
        image: null,
      });

      if ('project' in result) {
        testProjectId = result.project.project;
      }
    });

    test('should update project fields', async () => {
      const updateResult = await projectConcept.update({
        project: testProjectId,
        title: 'Updated Lifecycle Test Project',
        estimatedHours: 25,
        difficulty: 'advanced',
      });

      expect(updateResult).toHaveProperty('project');
      if ('project' in updateResult) {
        expect(updateResult.project.title).toBe('Updated Lifecycle Test Project');
        expect(updateResult.project.estimatedHours).toBe(25);
        expect(updateResult.project.difficulty).toBe('advanced');
      }
    });

    test('should delete project', async () => {
      const deleteResult = await projectConcept.delete({
        project: testProjectId
      });

      expect(deleteResult).toHaveProperty('success');
      if ('success' in deleteResult) {
        expect(deleteResult.success).toBe(true);
      }

      // Verify project is deleted
      const retrieveResult = await projectConcept._getByProject({
        project: testProjectId
      });
      expect(retrieveResult).toHaveLength(0);
    });
  });
});
