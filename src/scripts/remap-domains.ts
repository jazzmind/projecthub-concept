#!/usr/bin/env npx tsx

import { prisma } from '../lib/prisma';

// Target domain categories
const targetDomains = [
  'Digital Marketing',
  'Sustainable Impact', 
  'International Business',
  'Growth Strategy',
  'Artificial Intelligence',
  'Talent & Culture',
  'Business Analytics & Insights',
  'Supply Chain',
  'Technology Innovation',
  'Policy',
  'PR',
  'Legal'
];

// Intelligent domain mapping based on keywords and patterns
function mapDomainIntelligently(currentDomain: string, description?: string, title?: string): string {
  const domain = currentDomain.toLowerCase();
  const desc = description?.toLowerCase() || '';
  const titleText = title?.toLowerCase() || '';
  const allText = `${domain} ${desc} ${titleText}`;

  // Digital Marketing - social media, digital campaigns, content strategy
  if (domain.includes('digital marketing') || 
      domain.includes('social media') ||
      domain.includes('marketing research & content strategy') ||
      domain.includes('web development (digital marketing)') ||
      allText.includes('social media strategy') ||
      allText.includes('digital campaign') ||
      allText.includes('content strategy')) {
    return 'Digital Marketing';
  }

  // Sustainable Impact - environmental, nonprofit, social impact
  if (domain.includes('sustainability') ||
      domain.includes('social impact') ||
      domain.includes('environmental') ||
      domain.includes('nonprofit') ||
      allText.includes('environmental') ||
      allText.includes('sustainability') ||
      allText.includes('social impact') ||
      allText.includes('non-profit') ||
      allText.includes('wildlife') ||
      allText.includes('bereavement') ||
      allText.includes('disability') ||
      allText.includes('health advocacy')) {
    return 'Sustainable Impact';
  }

  // International Business - trade, international markets, global expansion
  if (domain.includes('international') ||
      domain.includes('trade') ||
      allText.includes('international market') ||
      allText.includes('international trade') ||
      allText.includes('global market') ||
      allText.includes('market entry') ||
      allText.includes('expansion')) {
    return 'International Business';
  }

  // Growth Strategy - fundraising, venture funding, startup strategy, business development
  if (domain.includes('fundraising') ||
      domain.includes('venture') ||
      domain.includes('startup') ||
      domain.includes('business development') ||
      domain.includes('grant strategy') ||
      domain.includes('strategic planning') ||
      allText.includes('growth strategy') ||
      allText.includes('fundraising') ||
      allText.includes('startup strategy') ||
      allText.includes('venture funding') ||
      allText.includes('business development') ||
      allText.includes('grant funding') ||
      allText.includes('investment')) {
    return 'Growth Strategy';
  }

  // Artificial Intelligence - AI, ML, data science, automation, VR/XR
  if (domain.includes('cybersecurity') ||
      domain.includes('emerging technologies') ||
      domain.includes('xr/vr') ||
      domain.includes('data science') ||
      domain.includes('process automation') ||
      domain.includes('web development and digital marketing') ||
      allText.includes('artificial intelligence') ||
      allText.includes('machine learning') ||
      allText.includes('virtual reality') ||
      allText.includes('automation') ||
      allText.includes('cybersecurity') ||
      allText.includes('data science') ||
      allText.includes('vr ') ||
      allText.includes('tech startup')) {
    return 'Artificial Intelligence';
  }

  // Technology Innovation - product development, hardware, SaaS, tech strategy
  if (domain.includes('product development') ||
      domain.includes('hardware product') ||
      domain.includes('product strategy') ||
      domain.includes('product management') ||
      domain.includes('saas') ||
      allText.includes('product development') ||
      allText.includes('saas') ||
      allText.includes('software') ||
      allText.includes('platform') ||
      allText.includes('app') ||
      allText.includes('hardware') ||
      allText.includes('innovation')) {
    return 'Technology Innovation';
  }

  // Business Analytics & Insights - market research, data analysis, competitive analysis
  if (domain.includes('market research') ||
      domain.includes('business analysis') ||
      domain.includes('data analysis') ||
      domain.includes('strategic analysis') ||
      domain.includes('competitive analysis') ||
      domain.includes('geospatial analysis') ||
      allText.includes('market research') ||
      allText.includes('business analysis') ||
      allText.includes('analytics') ||
      allText.includes('data analysis') ||
      allText.includes('competitive analysis')) {
    return 'Business Analytics & Insights';
  }

  // Policy - policy research, government, public sector, regulatory
  if (domain.includes('policy') ||
      domain.includes('public policy') ||
      allText.includes('policy research') ||
      allText.includes('government') ||
      allText.includes('public policy') ||
      allText.includes('regulatory') ||
      allText.includes('public sector')) {
    return 'Policy';
  }

  // PR - communications, strategic communications, brand awareness
  if (domain.includes('marketing & communications') ||
      domain.includes('strategic communications') ||
      domain.includes('communications / strategy') ||
      domain.includes('communications strategy') ||
      domain.includes('marketing / market research / communications') ||
      allText.includes('public relations') ||
      allText.includes(' pr ') ||
      allText.includes('brand awareness') ||
      allText.includes('strategic communications') ||
      allText.includes('communications audit') ||
      allText.includes('communications strategy') ||
      (allText.includes('communications') && !allText.includes('digital marketing') && !allText.includes('social media'))) {
    return 'PR';
  }

  // Supply Chain - logistics, operations, manufacturing, distribution
  if (domain.includes('supply') ||
      domain.includes('logistics') ||
      domain.includes('manufacturing') ||
      allText.includes('supply chain') ||
      allText.includes('logistics') ||
      allText.includes('operations') ||
      allText.includes('distribution') ||
      allText.includes('procurement')) {
    return 'Supply Chain';
  }

  // Talent & Culture - HR, organizational development, workforce, leadership
  if (domain.includes('talent') ||
      domain.includes('culture') ||
      domain.includes('human resources') ||
      domain.includes('market benchmarking and process automation project for an hr') ||
      allText.includes('talent') ||
      allText.includes('culture') ||
      allText.includes('hr ') ||
      allText.includes('leadership development') ||
      allText.includes('workforce') ||
      allText.includes('organizational development') ||
      allText.includes('employee') ||
      allText.includes('hr outsourcing') ||
      allText.includes('human resources')) {
    return 'Talent & Culture';
  }

  // Legal - legal, compliance, intellectual property, regulation
  if (domain.includes('legal') ||
      domain.includes('intellectual property') ||
      domain.includes('business strategy / intellectual property') ||
      allText.includes('legal') ||
      allText.includes('compliance') ||
      allText.includes('intellectual property') ||
      allText.includes('ip research') ||
      allText.includes('regulation') ||
      allText.includes('law')) {
    return 'Legal';
  }

  // Enhanced fallback logic - be more specific about business strategy vs marketing
  if (domain.includes('business strategy') ||
      allText.includes('business strategy') ||
      allText.includes('strategic planning')) {
    return 'Growth Strategy';
  }

  if (domain.includes('marketing strategy') ||
      domain.includes('marketing & market research') ||
      allText.includes('marketing strategy')) {
    return 'Digital Marketing';
  }

  if (domain.includes('market research') || allText.includes('market research')) {
    return 'Business Analytics & Insights';
  }

  // Final fallback
  return 'Business Analytics & Insights';
}

async function analyzeDomainMapping() {
  try {
    console.log('🔍 Analyzing current domain distribution...\n');

    // Get all unique domains with project details for intelligent mapping
    const projects = await prisma.project.findMany({
      select: {
        domain: true,
        description: true,
        title: true
      }
    });

    // Group by current domain and analyze mapping
    const domainAnalysis = new Map<string, { count: number; mappedTo: string; examples: string[] }>();

    projects.forEach(project => {
      const currentDomain = project.domain;
      if (!domainAnalysis.has(currentDomain)) {
        const mappedDomain = mapDomainIntelligently(currentDomain, project.description, project.title);
        domainAnalysis.set(currentDomain, { 
          count: 0, 
          mappedTo: mappedDomain,
          examples: []
        });
      }
      
      const analysis = domainAnalysis.get(currentDomain)!;
      analysis.count++;
      if (analysis.examples.length < 2) {
        analysis.examples.push(project.title);
      }
    });

    // Display mapping analysis grouped by target domain
    console.log('📊 Proposed Domain Mapping:\n');
    
    const mappingByTarget = new Map<string, Array<{ current: string; count: number; examples: string[] }>>();
    
    domainAnalysis.forEach((analysis, currentDomain) => {
      if (!mappingByTarget.has(analysis.mappedTo)) {
        mappingByTarget.set(analysis.mappedTo, []);
      }
      mappingByTarget.get(analysis.mappedTo)!.push({
        current: currentDomain,
        count: analysis.count,
        examples: analysis.examples
      });
    });

    // Sort target domains and display
    targetDomains.forEach(targetDomain => {
      const mappings = mappingByTarget.get(targetDomain) || [];
      const totalProjects = mappings.reduce((sum, m) => sum + m.count, 0);
      
      console.log(`🎯 ${targetDomain} (${totalProjects} projects)`);
      mappings
        .sort((a, b) => b.count - a.count)
        .forEach(mapping => {
          console.log(`   ← "${mapping.current}" (${mapping.count} projects)`);
          mapping.examples.forEach(example => {
            console.log(`     • ${example}`);
          });
        });
      console.log('');
    });

    // Summary statistics
    console.log('📈 Summary:');
    console.log(`Total current domains: ${domainAnalysis.size}`);
    console.log(`Total projects: ${projects.length}`);
    console.log(`Target domains: ${targetDomains.length}`);
    
    return { domainAnalysis, mappingByTarget };

  } catch (error) {
    console.error('❌ Error analyzing domains:', error);
    throw error;
  }
}

async function executeDomainRemapping() {
  try {
    console.log('🚀 Starting domain remapping process...\n');
    
    // Get all projects first (simpler approach)
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        domain: true,
        description: true,
        title: true
      }
    });

    console.log(`Found ${projects.length} projects to process\n`);
    
    // Group by domain for reporting
    const domainMap = new Map<string, {count: number, newDomain: string, projectIds: string[]}>();
    
    projects.forEach(project => {
      const newDomain = mapDomainIntelligently(project.domain, project.description, project.title);
      
      if (!domainMap.has(project.domain)) {
        domainMap.set(project.domain, {count: 0, newDomain, projectIds: []});
      }
      const entry = domainMap.get(project.domain)!;
      entry.count++;
      entry.projectIds.push(project.id);
    });

    // Show mapping preview
    console.log('📊 Domain mapping preview:');
    for (const [oldDomain, data] of domainMap) {
      console.log(`  "${oldDomain}" → "${data.newDomain}" (${data.count} projects)`);
    }
    
    console.log('\n⚠️  This will update all project domains. Press Ctrl+C to cancel or wait 5 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔄 Executing domain remapping...\n');

    let totalUpdated = 0;

    // Update each domain group
    for (const [oldDomain, data] of domainMap) {
      if (oldDomain !== data.newDomain) {
        const result = await prisma.project.updateMany({
          where: { domain: oldDomain },
          data: { domain: data.newDomain }
        });

        if (result.count > 0) {
          console.log(`✅ "${oldDomain}" → "${data.newDomain}" (${result.count} projects)`);
          totalUpdated += result.count;
        }
      } else {
        console.log(`⏭️  "${oldDomain}" (no change needed, ${data.count} projects)`);
      }
    }

    console.log(`\n🎉 Successfully updated ${totalUpdated} projects`);

    // Show final distribution
    console.log('\n📊 Final domain distribution:');
    const finalDomains = await prisma.project.groupBy({
      by: ['domain'],
      _count: { _all: true },
      orderBy: { domain: 'asc' }
    });

    finalDomains.forEach(item => {
      console.log(`  "${item.domain}": ${item._count._all} projects`);
    });

    console.log('\n✨ Domain remapping completed successfully!');

  } catch (error) {
    console.error('❌ Error during domain remapping:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'analyze':
      await analyzeDomainMapping();
      break;
    case 'execute':
      await executeDomainRemapping();
      break;
    default:
      console.log('Usage:');
      console.log('  npx tsx src/scripts/remap-domains.ts analyze   # Preview the mapping');
      console.log('  npx tsx src/scripts/remap-domains.ts execute   # Execute the remapping');
      break;
  }
}

if (require.main === module) {
  main();
}

export { analyzeDomainMapping, executeDomainRemapping, mapDomainIntelligently };
