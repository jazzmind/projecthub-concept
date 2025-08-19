import { Profile } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class ProfileConcept {

  async create(input: {
    profileType: string;
    bio: string;
    title?: string;
    company?: string;
    timezone?: string;
  }): Promise<{ profile: Profile } | { error: string }> {
    try {
      const profile = await prisma.profile.create({
        data: {
          profileType: input.profileType,
          bio: input.bio,
          title: input.title,
          company: input.company,
          timezone: input.timezone || "UTC",
          rating: 0,
          isActive: true,
          isVerified: false,
        }
      });

      return { profile };
    } catch (error) {
      return { error: `Failed to create profile: ${error}` };
    }
  }

  async update(input: {
    id: string;
    bio?: string;
    title?: string;
    company?: string;
    linkedinUrl?: string;
    website?: string;
    timezone?: string;
    hourlyRate?: number;
  }): Promise<{ profile: Profile } | { error: string }> {
    try {
      const profile = await prisma.profile.update({
        where: { id: input.id },
        data: {
          bio: input.bio,
          title: input.title,
          company: input.company,
          linkedinUrl: input.linkedinUrl,
          website: input.website,
          timezone: input.timezone,
          hourlyRate: input.hourlyRate,
          updatedAt: new Date()
        }
      });

      return { profile };
    } catch (error) {
      return { error: `Failed to update profile: ${error}` };
    }
  }

  async verify(input: {
    id: string;
  }): Promise<{ profile: Profile } | { error: string }> {
    try {
      const profile = await prisma.profile.update({
        where: { id: input.id },
        data: { 
          isVerified: true,
          updatedAt: new Date()
        }
      });

      return { profile };
    } catch (error) {
      return { error: `Failed to verify profile: ${error}` };
    }
  }

  async activate(input: {
    id: string;
  }): Promise<{ profile: Profile } | { error: string }> {
    try {
      const profile = await prisma.profile.update({
        where: { id: input.id },
        data: { 
          isActive: true,
          updatedAt: new Date()
        }
      });

      return { profile };
    } catch (error) {
      return { error: `Failed to activate profile: ${error}` };
    }
  }

  async deactivate(input: {
    id: string;
  }): Promise<{ profile: Profile } | { error: string }> {
    try {
      const profile = await prisma.profile.update({
        where: { id: input.id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      return { profile };
    } catch (error) {
      return { error: `Failed to deactivate profile: ${error}` };
    }
  }

  async delete(input: {
    id: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      // Delete profile
      await prisma.profile.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete profile: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Profile[]> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: input.id }
      });
      return profile ? [profile] : [];
    } catch {
      return [];
    }
  }

  async _getByType(input: { profileType: string }): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: { 
        profileType: input.profileType,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _getVerified(): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: { 
        isVerified: true,
        isActive: true 
      },
      orderBy: { rating: 'desc' }
    });
  }

  async _getTopRated(input: { limit: number }): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
      take: input.limit
    });
  }

  async _searchByKeywords(input: { keywords: string[] }): Promise<Profile[]> {
    const searchTerms = input.keywords.join(' | ');
    return await prisma.profile.findMany({
      where: {
        isActive: true,
        OR: [
          { bio: { contains: searchTerms, mode: 'insensitive' } },
          { company: { contains: searchTerms, mode: 'insensitive' } },
          { title: { contains: searchTerms, mode: 'insensitive' } }
        ]
      },
      orderBy: { rating: 'desc' }
    });
  }

  async _getByCompany(input: { company: string }): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: { 
        company: input.company,
        isActive: true 
      },
      orderBy: { rating: 'desc' }
    });
  }

  async _getActive(): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }


  // _getAvailableForProject removed; use Skill + Relationship queries in syncs
}
