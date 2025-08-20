import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { industryGroupingService } from '@/lib/ai/industryGroupingService';

interface IndustryGroup {
  id: string;
  category: string;
  industries: Array<{
    name: string;
    count: number;
    projectIds: string[];
  }>;
  totalProjects: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get all projects
    const allProjectsRaw = await prisma.project.findMany({
      select: {
        id: true,
        industry: true,
      },
    });

    // Filter out projects without industries
    const allProjects = allProjectsRaw.filter(project => 
      project.industry && project.industry.trim() !== ''
    );

    // Group by industry manually
    const industryMap = new Map<string, string[]>();
    allProjects.forEach(project => {
      if (project.industry) {
        if (!industryMap.has(project.industry)) {
          industryMap.set(project.industry, []);
        }
        industryMap.get(project.industry)!.push(project.id);
      }
    });

    // Convert to the expected format
    const industriesRaw = Array.from(industryMap.entries()).map(([industry, projectIds]) => ({
      industry,
      _count: { id: projectIds.length },
      projectIds,
    })).sort((a, b) => b._count.id - a._count.id);

    // Convert to the expected format
    const industriesWithProjects = industriesRaw.map((item) => ({
      name: item.industry || '',
      count: item._count.id,
      projectIds: item.projectIds,
    }));

    // Use AI to group related industries
    const industryNames = industriesWithProjects.map(i => i.name);
    const aiGroups = await industryGroupingService.groupIndustries(industryNames);

    // Deduplicate industries across groups - first occurrence wins
    const usedIndustries = new Set<string>();
    const deduplicatedAiGroups = aiGroups.map(group => ({
      ...group,
      industries: group.industries.filter(industryName => {
        if (usedIndustries.has(industryName)) {
          console.log(`Duplicate industry detected: "${industryName}" - skipping`);
          return false;
        }
        usedIndustries.add(industryName);
        return true;
      })
    }));

    // Convert AI groups to our format with project data
    const industryGroups: IndustryGroup[] = deduplicatedAiGroups.map((group, index) => {
      const groupIndustries = group.industries.map(industryName => {
        return industriesWithProjects.find(i => i.name === industryName);
      }).filter(Boolean) as typeof industriesWithProjects;

      const totalProjects = groupIndustries.reduce((sum, industry) => sum + industry.count, 0);

      return {
        id: `group-${index}`,
        category: group.category,
        industries: groupIndustries,
        totalProjects,
      };
    }).filter(group => group.industries.length > 0); // Remove empty groups

    // Handle any industries that weren't grouped by AI
    const groupedIndustryNames = new Set(
      industryGroups.flatMap(group => group.industries.map(i => i.name))
    );
    
    const ungroupedIndustries = industriesWithProjects.filter(
      industry => !groupedIndustryNames.has(industry.name)
    );

    // Add ungrouped industries to the "Other" category
    if (ungroupedIndustries.length > 0) {
      // Find existing "Other" group or create one
      let otherGroup = industryGroups.find(group => group.category === "Other");
      
      if (otherGroup) {
        // Add ungrouped industries to existing "Other" group
        otherGroup.industries.push(...ungroupedIndustries);
        otherGroup.totalProjects += ungroupedIndustries.reduce((sum, industry) => sum + industry.count, 0);
      } else {
        // Create new "Other" group
        industryGroups.push({
          id: `other`,
          category: "Other",
          industries: ungroupedIndustries,
          totalProjects: ungroupedIndustries.reduce((sum, industry) => sum + industry.count, 0),
        });
      }
    }

    // Sort groups by total project count
    industryGroups.sort((a, b) => b.totalProjects - a.totalProjects);

    return NextResponse.json({
      success: true,
      groups: industryGroups,
      totalIndustries: industryNames.length,
      totalGroups: industryGroups.length,
    });

  } catch (error) {
    console.error('Error consolidating industries:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

interface ConsolidationRequest {
  groups: {
    category: string;
    industryNames: string[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { groups }: ConsolidationRequest = await request.json();
    
    console.log('Applying industry consolidation for', groups.length, 'groups');
    
    let updatedProjects = 0;
    
    // Process each group
    for (const group of groups) {
      if (group.industryNames.length > 0) {
        // Update all projects that have any of the industry names in this group
        const result = await prisma.project.updateMany({
          where: {
            industry: {
              in: group.industryNames,
            },
          },
          data: {
            industry: group.category,
          },
        });
        
        updatedProjects += result.count;
        console.log(`Updated ${result.count} projects from industries [${group.industryNames.join(', ')}] to "${group.category}"`);
      }
    }

    return NextResponse.json({
      success: true,
      updatedProjects,
      processedGroups: groups.length,
    });

  } catch (error) {
    console.error('Error applying industry consolidation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
