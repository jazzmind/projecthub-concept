import { PrismaClient, Organization, OrganizationType } from "@prisma/client";

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
      const existingOrg = await this.prisma.organization.findUnique({
        where: { domain: input.domain }
      });
      if (existingOrg) {
        return { error: "Organization with this domain already exists" };
      }

      const organization = await this.prisma.organization.create({
        data: {
          name: input.name,
          description: input.description,
          managingOrganizationId: input.managingOrganizationId || null,
          domain: input.domain,
          type: input.type as OrganizationType,
          contactEmail: input.contactEmail,
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
      // Check for child organizations
      const childOrgs = await this.prisma.organization.count({
        where: { managingOrganizationId: input.id }
      });
      if (childOrgs > 0) {
        return { error: "Cannot delete organization with child organizations" };
      }

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
      const org = await this.prisma.organization.findUnique({
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
        where: { managingOrganizationId: input.managingOrganizationId }
      });
      return orgs;
    } catch {
      return [];
    }
  }

  async _getTopLevel(): Promise<Organization[]> {
    try {
      const orgs = await this.prisma.organization.findMany({
        where: { managingOrganizationId: null }
      });
      return orgs;
    } catch {
      return [];
    }
  }

  async _getAllByType(input: { type: string }): Promise<Organization[]> {
    try {
      const orgs = await this.prisma.organization.findMany({
        where: { type: input.type as OrganizationType }
      });
      return orgs;
    } catch {
      return [];
    }
  }
}
