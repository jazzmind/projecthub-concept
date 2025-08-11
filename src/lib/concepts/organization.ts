import { PrismaClient, Organization } from "@prisma/client";

const prisma = new PrismaClient();

export class OrganizationConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
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
        const managingOrg = await this.prisma.organization.findUnique({
          where: { id: input.managingOrganizationId }
        });
        if (!managingOrg) {
          return { error: "Managing organization not found" };
        }
      }

      // Check domain uniqueness
      const existingOrg = await this.prisma.organization.findFirst({
        where: { domain: input.domain }
      });
      if (existingOrg) {
        return { error: "Organization with this domain already exists" };
      }

      const organization = await this.prisma.organization.create({
        data: {
          organization: `org-${Date.now()}`, // Generic identifier
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

      const organization = await this.prisma.organization.update({
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

      await this.prisma.organization.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete organization: ${error}` };
    }
  }

  async _getById(input: { id: string }): Promise<Organization[]> {
    try {
      const org = await this.prisma.organization.findUnique({
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
      const org = await this.prisma.organization.findFirst({
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
      const orgs = await this.prisma.organization.findMany({
        where: { organizationType: "education" } // Simplified - no hierarchy
      });
      return orgs;
    } catch {
      return [];
    }
  }

  async _getTopLevel(): Promise<Organization[]> {
    try {
      const orgs = await this.prisma.organization.findMany({
        where: { organizationType: "education" } // Simplified root org query
      });
      return orgs;
    } catch {
      return [];
    }
  }

  async _getAllByType(input: { type: string }): Promise<Organization[]> {
    try {
      const orgs = await this.prisma.organization.findMany({
        where: { organizationType: input.type }
      });
      return orgs;
    } catch {
      return [];
    }
  }
}
