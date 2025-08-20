import { MODELS } from './models';
import { AIService } from './aiService';
import { z } from 'zod';

interface IndustryGroup {
  category: string;
  industries: string[];
}

/**
 * Service for AI-powered industry grouping and consolidation
 */
export class IndustryGroupingService extends AIService {
  constructor() {
    super({
      organizationId: 'system',
      sessionId: 'industry-grouping',
    });
  }

  /**
   * Group related industries using AI
   */
  async groupIndustries(industryNames: string[]): Promise<IndustryGroup[]> {
    try {
      console.log('Grouping industries with AI:', industryNames.length, 'industries');
      
      const groupingPrompt = this.buildGroupingPrompt(industryNames);
      const responseSchema = z.object({
        results: z.array(z.object({
          category: z.string(),
          industries: z.array(z.string()),
        })),
      });   
      const aiResponse = await this.callAI(
        MODELS.default,
        [{
          content: [{
            type: 'input_text',
            text: groupingPrompt,
          }],
          role: 'user',
        }],
        responseSchema,
        'group-industries',
        'response',
        {
          retryable: true,
          reasoningEffort: 'low',
          verbosity: 'low',
        },
      );
      console.log('AI groups', aiResponse.results);
      return aiResponse.results;
    } catch (error) {
      console.error('Failed to group industries with AI:', error);
      // Fallback: create individual groups
      return industryNames.map(name => ({
        category: name,
        industries: [name]
      }));
    }
  }

  
  /**
   * Build the AI prompt for industry grouping
   */
  private buildGroupingPrompt(industryNames: string[]): string {
    const industryCategories = [
      "Healthcare & Wellness",
      "Finance, Banking & Insurance",
      "Technology & Software",
      "Retail, Food & Consumer Goods",
      "Manufacturing & Industrial",
      "Energy & Utilities",
      "Transportation & Logistics",
      "Real Estate, Architecture & Construction",
      "Legal, Accounting & Consulting Services",
      "Education & Training",
      "Non-Profit & Social Impact",
      "Media & Entertainment",
      "Travel & Hospitality",
      "Other"
    ];
    return `
Group these industries into one of the following categories. Return a JSON array where each group has:
- "category": one of the industry categories
- "industries": array of source industry names that map to this group

Industries to group:
${industryNames.length > 0 ? industryNames.map(name => `- ${name}`).join('\n') : 'No industries to group'}

Industry categories:
${industryCategories.map(name => `- ${name}`).join('\n')}

Rules:
1. Group similar/related industries together (e.g., "AI/ML", "Machine Learning", "Artificial Intelligence")
2. If an industry maps to multiple categories, it should be in the most general category
3. Really try to avoid putting an industry in the "Other" category unless it really doesn't fit into any other category

`;
}

 
}

// Export singleton instance
export const industryGroupingService = new IndustryGroupingService();
