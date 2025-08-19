import { Membership } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class MembershipConcept {
  // Build an index description for member -> target pair. No side-effects.
  async index(input: {
    memberEntityType: string;
    targetEntityType: string;
    relationType?: string;
  }): Promise<{ index: { memberEntityType: string; targetEntityType: string; relationType: string; key: string } } | { error: string } > {
    try {
      const relationType = input.relationType || "membership";
      const key = `${input.memberEntityType}::${input.targetEntityType}::${relationType}`;
      return {
        index: {
          memberEntityType: input.memberEntityType,
          targetEntityType: input.targetEntityType,
          relationType,
          key,
        }
      };
    } catch (error) {
      return { error: `Failed to build membership index: ${error}` };
    }
  }

  async invite(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
    roleEntityId: string;
    invitedBy: string;
    message?: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      // Check if membership already exists
      const existing = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (existing) {
        return { error: "Membership already exists" };
      }

      const membership = await prisma.membership.create({
        data: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          roleEntityId: input.roleEntityId,
          isActive: false,
          status: "invited",
          invitedBy: input.invitedBy,
          invitedAt: new Date(),
          invitationMessage: input.message,
        }
      });

      return { membership };
    } catch (error) {
      return { error: `Failed to create invitation: ${error}` };
    }
  }

  async accept(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          status: "invited"
        }
      });

      if (!membership) {
        return { error: "Invitation not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "active",
          isActive: true,
          joinedAt: new Date()
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to accept invitation: ${error}` };
    }
  }

  async reject(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          status: "invited"
        }
      });

      if (!membership) {
        return { error: "Invitation not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "left",
          leftAt: new Date()
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to reject invitation: ${error}` };
    }
  }

  async approve(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
    approvedBy: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "active",
          isActive: true,
          approvedBy: input.approvedBy,
          approvedAt: new Date(),
          joinedAt: new Date()
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to approve membership: ${error}` };
    }
  }

  async suspend(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "suspended",
          isActive: false
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to suspend membership: ${error}` };
    }
  }

  async reactivate(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "active",
          isActive: true
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to reactivate membership: ${error}` };
    }
  }

  async leave(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: "left",
          isActive: false,
          leftAt: new Date()
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to leave: ${error}` };
    }
  }

  async updateRole(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
    roleEntityId: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          roleEntityId: input.roleEntityId
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to update role: ${error}` };
    }
  }

  async delete(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      if (membership.isActive) {
        return { error: "Cannot delete active membership" };
      }

      await prisma.membership.delete({
        where: { id: membership.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete membership: ${error}` };
    }
  }

  // Queries
  async _getByMemberEntity(input: { memberEntityType: string; memberEntityId?: string, isActive?: boolean | undefined }): Promise<Membership[]> {
    try {
      const memberships = await prisma.membership.findMany({
        where: { 
          memberEntityType: input.memberEntityType, 
          memberEntityId: input.memberEntityId || undefined,
          isActive: input.isActive || undefined
        }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByTargetEntity(input: { targetEntityType: string; targetEntityId?: string, isActive?: boolean | undefined }): Promise<Membership[]> {
    try {
      const memberships = await prisma.membership.findMany({
        where: { 
          targetEntityType: input.targetEntityType, 
          targetEntityId: input.targetEntityId || undefined,
          isActive: input.isActive || undefined
        }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByMemberEntityAndTargetEntity(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
    isActive?: boolean | undefined;
  }): Promise<Membership[]> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          isActive: input.isActive || undefined
        }
      });
      return membership ? [membership] : [];
    } catch {
      return [];
    }
  }

  async _getByRole(input: { roleEntityId: string, isActive?: boolean | undefined }): Promise<Membership[]> {
    try {
      const memberships = await prisma.membership.findMany({
        where: { roleEntityId: input.roleEntityId, isActive: input.isActive || undefined }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Membership[]> {
    try {
      const memberships = await prisma.membership.findMany({
        where: { status: input.status }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getPendingInvitations(input: { memberEntityType: string; memberEntityId?: string }): Promise<Membership[]> {
    try {
      const memberships = await prisma.membership.findMany({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId || undefined,
          status: "invited"
        }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _isActive(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<boolean[]> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          isActive: true
        }
      });
      return [!!membership];
    } catch {
      return [false];
    }
  }

  async _hasRole(input: {
    memberEntityType: string;
    memberEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
    roleEntityId: string;
  }): Promise<boolean[]> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: input.memberEntityType,
          memberEntityId: input.memberEntityId,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          roleEntityId: input.roleEntityId,
          isActive: true
        }
      });
      return [!!membership];
    } catch {
      return [false];
    }
  }
}
