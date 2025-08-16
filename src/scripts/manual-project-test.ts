#!/usr/bin/env npx tsx

/**
 * Manual test script to validate project creation works correctly
 * This bypasses AI services and directly tests database operations
 */

import { ProjectConcept } from '../lib/concepts/project/project';
import { v4 as uuidv4 } from 'uuid';

const testProjects = [
  {
    title: 'Web Development Portfolio Project',
    description: 'Create a personal portfolio website showcasing programming skills, projects, and professional experience. Students will learn HTML, CSS, JavaScript, and responsive design principles.',
    scope: 'Frontend development only, no backend or database required. Focus on user experience and visual design.',
    industry: 'Technology',
    domain: 'Web Development', 
    difficulty: 'beginner' as const,
    estimatedHours: 15,
    deliverables: [
      'Responsive HTML/CSS website',
      'JavaScript interactive elements',
      'Mobile-optimized design',
      'Deployment documentation'
    ]
  },
  {
    title: 'Data Analysis for Marketing Campaign',
    description: 'Analyze the effectiveness of a digital marketing campaign using statistical methods and data visualization. Students will work with real-world marketing data to derive actionable insights.',
    scope: 'Data analysis using Python/R, creation of visualizations, statistical modeling. No access to proprietary tools required.',
    industry: 'Marketing',
    domain: 'Data Science',
    difficulty: 'intermediate' as const,
    estimatedHours: 30,
    deliverables: [
      'Data cleaning and preparation report',
      'Statistical analysis summary',
      'Data visualization dashboard',
      'Recommendations presentation',
      'Python/R code documentation'
    ]
  },
  {
    title: 'Sustainable Business Model Innovation',
    description: 'Design a sustainable business model for a startup in the renewable energy sector. This project combines business strategy, environmental impact assessment, and financial planning.',
    scope: 'Business model design, sustainability assessment, market research, financial projections. No actual startup creation required.',
    industry: 'Sustainability',
    domain: 'Business Strategy',
    difficulty: 'advanced' as const,
    estimatedHours: 50,
    deliverables: [
      'Business model canvas',
      'Sustainability impact assessment',
      'Market opportunity analysis',
      'Financial projections (5-year)',
      'Implementation roadmap',
      'Investor presentation deck'
    ]
  }
];

async function createTestProject(projectData: typeof testProjects[0], index: number) {
  const projectConcept = new ProjectConcept();
  const projectId = `manual-test-${Date.now()}-${index}`;

  console.log(`\n📝 Creating project ${index + 1}: ${projectData.title}`);
  console.log(`🏭 Industry: ${projectData.industry} | 🎯 Domain: ${projectData.domain}`);
  console.log(`⏱️  ${projectData.estimatedHours}h | 📊 ${projectData.difficulty}`);

  try {
    const result = await projectConcept.create({
      title: projectData.title,
      description: projectData.description,
      image: '/images/projects/default.jpg', // Default image
      scope: projectData.scope,
      industry: projectData.industry,
      domain: projectData.domain,
      difficulty: projectData.difficulty,
      estimatedHours: projectData.estimatedHours,
      deliverables: projectData.deliverables,
    });

    if ('project' in result) {
      console.log(`✅ Created successfully! ID: ${result.project.id}`);
      console.log(`📋 ${result.project.deliverables.length} deliverables`);
      return result.project;
    } else {
      console.log(`❌ Failed: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.log(`💥 Error: ${error}`);
    return null;
  }
}

async function testQueries(projects: any[]) {
  const projectConcept = new ProjectConcept();
  
  console.log('\n🔍 Testing project queries...');
  
  // Test by industry
  const techProjects = await projectConcept._getByIndustry({ industry: 'Technology' });
  console.log(`📊 Technology projects found: ${techProjects.length}`);
  
  // Test by difficulty
  const beginnerProjects = await projectConcept._getByDifficulty({ difficulty: 'beginner' });
  console.log(`🎯 Beginner projects found: ${beginnerProjects.length}`);
  
  // Test by domain
  const webDevProjects = await projectConcept._getByDomain({ domain: 'Web Development' });
  console.log(`💻 Web Development projects found: ${webDevProjects.length}`);
  
  // Test keyword search
  const analysisProjects = await projectConcept._searchByKeywords({ keywords: ['analysis', 'data'] });
  console.log(`🔎 Projects with 'analysis' or 'data': ${analysisProjects.length}`);
  
  // Test by estimated hours
  const shortProjects = await projectConcept._getByEstimatedHours({ minHours: 10, maxHours: 20 });
  console.log(`⏰ Short projects (10-20h): ${shortProjects.length}`);
}

async function runManualTest() {
  console.log('🧪 ProjectHub - Manual Project Creation Test');
  console.log('═'.repeat(50));
  console.log('Testing project creation without AI services\n');

  const createdProjects = [];

  // Create test projects
  for (const [index, projectData] of testProjects.entries()) {
    const project = await createTestProject(projectData, index);
    if (project) {
      createdProjects.push(project);
    }
    
    // Small delay between creates
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📈 Summary: ${createdProjects.length}/${testProjects.length} projects created successfully`);

  if (createdProjects.length > 0) {
    await testQueries(createdProjects);
    
    console.log('\n🎉 Manual test completed successfully!');
    console.log('✨ Project creation and saving functionality is working correctly.');
    
    // Test update
    console.log('\n🔄 Testing project update...');
    const firstProject = createdProjects[0];
    const projectConcept = new ProjectConcept();
    
    const updateResult = await projectConcept.update({
      id: firstProject.id,
      title: `UPDATED: ${firstProject.title}`,
      estimatedHours: firstProject.estimatedHours + 5,
    });
    
    if ('project' in updateResult) {
      console.log(`✅ Update successful: ${updateResult.project.title}`);
      console.log(`⏱️  New estimated hours: ${updateResult.project.estimatedHours}`);
    } else {
      console.log(`❌ Update failed: ${updateResult.error}`);
    }
    
  } else {
    console.log('\n❌ No projects were created successfully. Check your database connection and schema.');
    process.exit(1);
  }
}

// Run the test
runManualTest().catch(error => {
  console.error('Manual test failed:', error);
  process.exit(1);
});
