#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

const prisma = new PrismaClient();

interface ProjectBrief {
  project_title: string;
  client_name: string;
  industry: string;
  project_type: string;
  client_background: string;
  problem_statement: string;
  project_scope: string;
  focus_area: string;
  other_notes: string;
  deliverables: string[];
  technical_skills_required: string[];
  professional_skills_required: string[];
  duration_weeks: number;
}

function extractDomainFromIndustry(industry: string): string {
  const industryMap: { [key: string]: string } = {
    'HEALTH CARE AND SOCIAL ASSISTANCE': 'Healthcare',
    'ARTS AND RECREATION SERVICES': 'Arts & Media',
    'INFORMATION MEDIA AND TELECOMMUNICATIONS': 'Technology',
    'PROFESSIONAL, SCIENTIFIC AND TECHNICAL SERVICES': 'Consulting',
    'FINANCIAL AND INSURANCE SERVICES': 'Finance',
    'MANUFACTURING': 'Manufacturing',
    'CONSTRUCTION': 'Construction',
    'RETAIL TRADE': 'Retail',
    'EDUCATION AND TRAINING': 'Education',
    'AGRICULTURE, FORESTRY AND FISHING': 'Agriculture',
    'MINING': 'Mining',
    'TRANSPORT, POSTAL AND WAREHOUSING': 'Logistics',
    'ACCOMMODATION AND FOOD SERVICES': 'Hospitality',
    'REAL ESTATE SERVICES': 'Real Estate',
    'RENTAL, HIRING AND REAL ESTATE SERVICES': 'Real Estate',
    'ADMINISTRATIVE AND SUPPORT SERVICES': 'Administration',
    'PUBLIC ADMINISTRATION AND SAFETY': 'Government',
    'OTHER SERVICES': 'Services',
    'ELECTRICITY, GAS, WATER AND WASTE SERVICES': 'Utilities'
  };

  // Clean up industry string and extract main category
  const cleanIndustry = industry.replace(/^\+?\d+\s*/, '').trim().toUpperCase();
  
  for (const [key, value] of Object.entries(industryMap)) {
    if (cleanIndustry.includes(key)) {
      return value;
    }
  }

  // Default mapping based on keywords
  if (cleanIndustry.includes('TECH') || cleanIndustry.includes('SOFTWARE') || cleanIndustry.includes('IT')) {
    return 'Technology';
  }
  if (cleanIndustry.includes('HEALTH') || cleanIndustry.includes('MEDICAL')) {
    return 'Healthcare';
  }
  if (cleanIndustry.includes('FINANCE') || cleanIndustry.includes('BANK')) {
    return 'Finance';
  }
  if (cleanIndustry.includes('EDUCATION') || cleanIndustry.includes('UNIVERSITY')) {
    return 'Education';
  }

  return 'Business';
}

function extractSkillsFromBrief(brief: ProjectBrief): string[] {
  const allSkills = [...brief.technical_skills_required, ...brief.professional_skills_required];
  
  // Clean and deduplicate skills
  const cleanedSkills = allSkills
    .map(skill => skill.trim())
    .filter(skill => skill.length > 0)
    .reduce((unique: string[], skill) => {
      if (!unique.some(existing => existing.toLowerCase() === skill.toLowerCase())) {
        unique.push(skill);
      }
      return unique;
    }, []);

  return cleanedSkills;
}

function determineDifficulty(brief: ProjectBrief): string {
  const duration = brief.duration_weeks;
  const skills = extractSkillsFromBrief(brief);
  
  // Simple heuristic based on duration and number of required skills
  if (duration <= 8 && skills.length <= 5) {
    return 'beginner';
  } else if (duration <= 16 && skills.length <= 10) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

function estimateHours(durationWeeks: number): number {
  // Assume 10-15 hours per week for student projects
  const hoursPerWeek = 12;
  return durationWeeks * hoursPerWeek;
}

function generateTags(brief: ProjectBrief): string[] {
  const tags: string[] = [];
  
  // Add industry-based tags
  const domain = extractDomainFromIndustry(brief.industry);
  tags.push(domain);
  
  // Add project type
  if (brief.project_type) {
    tags.push(brief.project_type);
  }
  
  // Add skill-based tags
  const skills = extractSkillsFromBrief(brief);
  const topSkills = skills.slice(0, 3); // Take top 3 skills as tags
  tags.push(...topSkills);
  
  // Remove duplicates and clean up
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .reduce((unique: string[], tag) => {
      if (!unique.some(existing => existing.toLowerCase() === tag.toLowerCase())) {
        unique.push(tag);
      }
      return unique;
    }, []);
}

function cleanIndustryName(industry: string): string {
  // Remove phone numbers and clean up industry names
  return industry
    .replace(/^\+?\d+\s*/, '') // Remove phone numbers at start
    .trim()
    .split('\n')[0] // Take first line only
    .replace(/[A-Z\s]+$/, (match) => {
      // Convert all-caps to title case
      return match.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    });
}

async function importProjectBriefs(filePath?: string) {
  try {
    console.log('🚀 Starting project briefs import...');

    // Determine the JSON file path
    let jsonPath: string;
    if (filePath) {
      jsonPath = path.resolve(filePath);
    } else {
      jsonPath = path.resolve(process.cwd(), '../project-brief-generator/enhanced_project_briefs_v2.json');
    }
    
    console.log(`📁 Looking for file: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ File not found: ${jsonPath}`);
      if (!filePath) {
        console.log('Please ensure the enhanced_project_briefs_v2.json file exists in the project-brief-generator directory.');
        console.log('Or specify a custom path using: npm run import:projects -- --file /path/to/your/file.json');
      }
      process.exit(1);
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const projectBriefs: ProjectBrief[] = JSON.parse(jsonData);

    console.log(`📊 Found ${projectBriefs.length} project briefs to import`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const [index, brief] of projectBriefs.entries()) {
      try {
        // Generate a unique project identifier
        const projectId = `imported-brief-${index + 1}`;

        // Check if project already exists
        const existingProject = await prisma.project.findFirst({
          where: { id: projectId }
        });

        if (existingProject) {
          console.log(`⏭️  Skipping existing project: ${brief.project_title}`);
          skipped++;
          continue;
        }

        // Extract and clean data
        const industry = cleanIndustryName(brief.industry);
        const domain = extractDomainFromIndustry(brief.industry);
        const difficulty = determineDifficulty(brief);
        const estimatedHours = estimateHours(brief.duration_weeks);
        const requiredSkills = extractSkillsFromBrief(brief);
        const tags = generateTags(brief);

        // Prepare learning objectives from focus area
        const learningObjectives = brief.focus_area
          ? brief.focus_area.split('\n')
              .map(obj => obj.trim())
              .filter(obj => obj.length > 0 && !obj.startsWith('And avoid'))
              .slice(0, 5) // Limit to 5 objectives
          : [];

        // Create the project
        await prisma.project.create({
          data: {
            id: projectId,
            title: brief.project_title || `Project for ${brief.client_name}`,
            description: brief.problem_statement || brief.project_scope || 'No description provided',
            scope: brief.project_scope || brief.focus_area || 'Project scope to be defined',
            deliverables: learningObjectives, // Map learning objectives to deliverables
            industry,
            domain,
            difficulty,
            estimatedHours: estimatedHours || 40, // Default hours
            status: 'active'
          }
        });

        console.log(`✅ Imported: ${brief.project_title} (${difficulty}, ${estimatedHours}h)`);
        imported++;

      } catch (error) {
        console.error(`❌ Error importing project "${brief.project_title}":`, error);
        errors++;
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully imported: ${imported} projects`);
    console.log(`⏭️  Skipped (already exists): ${skipped} projects`);
    console.log(`❌ Errors: ${errors} projects`);

    if (imported > 0) {
      console.log('\n📝 Next steps:');
      console.log('1. Visit http://localhost:3000/manager/projects to view and manage the imported projects');
      console.log('2. Review and edit project details as needed');
      console.log('3. Set appropriate project statuses (active/draft/archived)');
    }

  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI setup
function setupCLI() {
  const program = new Command();
  
  program
    .name('import-projects')
    .description('Import project briefs from JSON file into ProjectHub database')
    .version('1.0.0')
    .option('-f, --file <path>', 'Path to the JSON file containing project briefs')
    .action(async (options) => {
      await importProjectBriefs(options.file);
    });

  return program;
}

// Run the import
if (require.main === module) {
  const program = setupCLI();
  program.parse(process.argv);
}

export { importProjectBriefs };
