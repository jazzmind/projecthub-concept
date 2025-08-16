import { Organization } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class OrganizationConcept {

  // List top-level organizations (action form for sync engine)
  async listTopLevel(input: {} = {}): Promise<{ organizations: Organization[] } | { error: string }> {
    try {
      const orgs = await prisma.organization.findMany({
        where: { isActive: true } // Get all active organizations
      });
      
      return { 
        organizations: orgs
      };
    } catch (error) {
      return { error: `Failed to list organizations: ${error}` };
    }
  }

  // Get organization by id (action form for API syncs)
  async getById(input: { id: string }): Promise<{ organization: Organization | null } | { error: string }> {
    try {
      const org = await prisma.organization.findUnique({ where: { id: input.id } });
      return { organization: org };
    } catch (error) {
      return { error: `Failed to get organization: ${error}` };
    }
  }

  async create(input: {
    name: string;
    description: string;
    managingOrganizationId?: string;
    type: string;
    domain: string;
    contactEmail: string;
    website?: string;
  }): Promise<{ organization: Organization } | { error: string }> {
    try {
      // Validate type
      if (!["education", "industry", "government", "nonprofit"].includes(input.type)) {
        return { error: "Invalid organization type" };
      }

      // Validate managing organization exists if provided
      if (input.managingOrganizationId) {
        const managingOrg = await prisma.organization.findUnique({
          where: { id: input.managingOrganizationId }
        });
        if (!managingOrg) {
          return { error: "Managing organization not found" };
        }
      }

      // Check domain uniqueness
      const existingOrg = await prisma.organization.findFirst({
        where: { domain: input.domain }
      });
      if (existingOrg) {
        return { error: "Organization with this domain already exists" };
      }

      const organization = await prisma.organization.create({
        data: {
          name: input.name,
          description: input.description,
          domain: input.domain,
          organizationType: input.type || "education",
          contactEmail: input.contactEmail || input.name + "@" + input.domain,
          website: input.website,
        }
      });
      
      return { organization };
    } catch (error) {
      return { error: `Failed to create organization: ${error}` };
    }
  }

  async update(input: {
    id: string;
    name?: string;
    description?: string;
    contactEmail?: string;
    website?: string;
  }): Promise<{ organization: Organization } | { error: string }> {
    try {
      const updateData: any = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;
      if (input.website !== undefined) updateData.website = input.website;

      const organization = await prisma.organization.update({
        where: { id: input.id },
        data: updateData
      });

      return { organization };
    } catch (error) {
      return { error: `Failed to update organization: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      // Note: Simplified - no hierarchy check in current schema

      await prisma.organization.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete organization: ${error}` };
    }
  }

  async _getById(input: { id: string }): Promise<Organization[]> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: input.id }
      });
      if (org) {
        return [org];
      }
      return [];
    } catch {
      return [];
    }
  }

  async _getByDomain(input: { domain: string }): Promise<Organization[]> {
    try {
      const org = await prisma.organization.findFirst({
        where: { domain: input.domain }
      });
      if (org) {
        return [org];
      }
      return [];
    } catch {
      return [];
    }
  }

  async _getChildren(input: { managingOrganizationId: string }): Promise<Organization[]> {
    try {
      const orgs = await prisma.organization.findMany({
        where: { organizationType: "education" } // Simplified - no hierarchy
      });
      return orgs;
    } catch {
      return [];
    }
  }

  async _getTopLevel(): Promise<Organization[]> {
    try {
      const orgs = await prisma.organization.findMany({
        where: { isActive: true } // Get all active organizations
      });
      return orgs;
    } catch {
      return [];
    }
  }

  async _getAllByType(input: { type: string }): Promise<Organization[]> {
    try {
      const orgs = await prisma.organization.findMany({
        where: { organizationType: input.type }
      });
      return orgs;
    } catch {
      return [];
    }
  }

  // Query method for sync pattern - returns proper format for frames.query (synchronous)
  _getTopLevelForPayload(input: {} = {}): { organizations: Organization[] }[] {
    // For now, return empty array - this will be populated by a separate action
    // This follows the pattern where the data is fetched by actions, not queries
    return [{ organizations: [] }];
  }
}
