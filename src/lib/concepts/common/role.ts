import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export class RoleConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    displayName: string;
    description: string;
    scope: string;
    permissions: object;
  }): Promise<{ role: Role } | { error: string }> {
    try {
      const role = await this.prisma.role.create({
        data: {
          displayName: input.displayName,
          description: input.description,
          scope: input.scope,
          permissions: input.permissions,
          isActive: true,
          isBuiltIn: false,
        }
      });

      return { role };
    } catch (error) {
      return { error: `Failed to create role: ${error}` };
    }
  }

  async update(input: {
    id: string;
    displayName?: string;
    description?: string;
    permissions?: object;
  }): Promise<{ role: Role } | { error: string }> {
    try {
      // Find role by name
      const role = await this.prisma.role.findFirst({
        where: { id: input.id }
      });

      if (!role) {
        return { error: "Role not found" };
      }

      if (role.isBuiltIn) {
        return { error: "Cannot update built-in role" };
      }

      const updateData: any = {};
      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.permissions !== undefined) updateData.permissions = input.permissions;

      const updatedRole = await this.prisma.role.update({
        where: { id: role.id },
        data: updateData
      });

      return { role: updatedRole };
    } catch (error) {
      return { error: `Failed to update role: ${error}` };
    }
  }

  async activate(input: { id: string }): Promise<{ role: Role } | { error: string }> {
    try {
      const role = await this.prisma.role.findFirst({
        where: { id: input.id }
      });

      if (!role) {
        return { error: "Role not found" };
      }

      const updatedRole = await this.prisma.role.update({
        where: { id: role.id },
        data: { isActive: true }
      });

      return { role: updatedRole };
    } catch (error) {
      return { error: `Failed to activate role: ${error}` };
    }
  }

  async deactivate(input: { id: string }): Promise<{ role: Role } | { error: string }> {
    try {
      const role = await this.prisma.role.findFirst({
        where: { id: input.id }
      });

      if (!role) {
        return { error: "Role not found" };
      }

      if (role.isBuiltIn) {
        return { error: "Cannot deactivate built-in role" };
      }

      const updatedRole = await this.prisma.role.update({
        where: { id: role.id },
        data: { isActive: false }
      });

      return { role: updatedRole };
    } catch (error) {
      return { error: `Failed to deactivate role: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const role = await this.prisma.role.findFirst({
        where: { id: input.id }
      });

      if (!role) {
        return { error: "Role not found" };
      }

      if (role.isBuiltIn) {
        return { error: "Cannot delete built-in role" };
      }

      await this.prisma.role.delete({
        where: { id: role.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete role: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Role | null> {
    try {
      const role = await this.prisma.role.findFirst({
        where: { id: input.id }
      });
      return role;
    } catch {
      return null;
    }
  }
  
  async _getByDisplayName(input: { displayName: string }): Promise<Role | null> {
    try {
      const role = await this.prisma.role.findFirst({
        where: { displayName: input.displayName }
      });
      return role;
    } catch {
      return null;
    } 
  }

  async _getByScope(input: { scope: string }): Promise<Role[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: { scope: input.scope }
      });
      return roles;
    } catch {
      return [];
    }
  }

  async _getActive(): Promise<Role[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: { isActive: true }
      });
      return roles;
    } catch {
      return [];
    }
  }

  async _getBuiltIn(): Promise<Role[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: { isBuiltIn: true }
      });
      return roles;
    } catch {
      return [];
    }
  }

  async _hasPermission(input: { id: string; resource: string; action: string }): Promise<boolean[]> {
    try {
      const role = await this.prisma.role.findFirst({
        where: { id: input.id }
      });

      if (!role) {
        return [false];
      }

      const permissions = role.permissions as any;
      const resourcePerms = permissions[input.resource];
      if (!resourcePerms) {
        return [false];
      }

      return [!!resourcePerms[input.action]];
    } catch {
      return [false];
    }
  }
}
