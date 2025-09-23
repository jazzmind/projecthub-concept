#!/usr/bin/env npx tsx

import { prisma } from '@/lib/prisma';

// Mapping configuration for industries
const industryMapping: { [key: string]: string } = {
  // Health & Medical Science
  'Healthcare & Wellness': 'Health & Medical Science',
  
  // IT, Engineering, & Computer Science
  'Technology & Software': 'IT, Engineering, & Computer Science',
  'Manufacturing & Industrial': 'IT, Engineering, & Computer Science',
  'Energy & Utilities': 'IT, Engineering, & Computer Science',
  'Transportation & Logistics': 'IT, Engineering, & Computer Science',
  
  // Law & Public Policy
  'Legal, Accounting & Consulting Services': 'Law & Public Policy',
  'Government & Public Sector': 'Law & Public Policy',
  
  // Communications, Media, Digital & Creative
  'Media & Entertainment': 'Communications, Media, Digital & Creative',
  
  // Strategy & Consultancy
  'Finance, Banking & Insurance': 'Strategy & Consultancy',
  'Education & Training': 'Strategy & Consultancy',
  'Retail, Food & Consumer Goods': 'Strategy & Consultancy', 
  'Travel & Hospitality': 'Strategy & Consultancy',
  
  // Not for Profit
  'Non-Profit & Social Impact': 'Not for Profit'
};

async function remapIndustries() {
  try {
    console.log('🔄 Starting industry remapping...');
    
    // First, show current state
    console.log('\n📊 Current industry distribution:');
    const currentIndustries = await prisma.project.groupBy({
      by: ['industry'],
      _count: {
        _all: true
      },
      orderBy: {
        industry: 'asc'
      }
    });
    
    currentIndustries.forEach(item => {
      const newIndustry = industryMapping[item.industry] || 'Strategy & Consultancy';
      console.log(`  "${item.industry}" (${item._count._all} projects) → "${newIndustry}"`);
    });
    
    // Confirm before proceeding
    console.log('\n⚠️  This will update all project industries. Press Ctrl+C to cancel or wait 5 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Execute the mapping in a transaction
    await prisma.$transaction(async (tx) => {
      let totalUpdated = 0;
      
      for (const [oldIndustry, newIndustry] of Object.entries(industryMapping)) {
        const result = await tx.project.updateMany({
          where: {
            industry: oldIndustry
          },
          data: {
            industry: newIndustry
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ Updated ${result.count} projects from "${oldIndustry}" to "${newIndustry}"`);
          totalUpdated += result.count;
        }
      }
      
      // Handle any unmapped industries (fallback to Strategy & Consultancy)
      const mappedIndustries = Object.keys(industryMapping);
      const unmappedProjects = await tx.project.findMany({
        where: {
          industry: {
            notIn: Object.values(industryMapping)
          }
        },
        select: {
          industry: true
        },
        distinct: ['industry']
      });
      
      for (const project of unmappedProjects) {
        if (!mappedIndustries.includes(project.industry)) {
          const result = await tx.project.updateMany({
            where: {
              industry: project.industry
            },
            data: {
              industry: 'Strategy & Consultancy'
            }
          });
          
          console.log(`🔄 Mapped unmapped industry "${project.industry}" to "Strategy & Consultancy" (${result.count} projects)`);
          totalUpdated += result.count;
        }
      }
      
      console.log(`\n🎉 Successfully updated ${totalUpdated} projects`);
    });
    
    // Show final state
    console.log('\n📊 Final industry distribution:');
    const finalIndustries = await prisma.project.groupBy({
      by: ['industry'],
      _count: {
        _all: true
      },
      orderBy: {
        industry: 'asc'
      }
    });
    
    finalIndustries.forEach(item => {
      console.log(`  "${item.industry}": ${item._count._all} projects`);
    });
    
    console.log('\n✨ Industry remapping completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during industry remapping:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the remapping
if (require.main === module) {
  remapIndustries();
}

export { remapIndustries };
