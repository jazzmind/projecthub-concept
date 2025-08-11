import { PrismaClient, Membership } from "@prisma/client";

const prisma = new PrismaClient();

export class MembershipConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async invite(input: {
    memberEntity: string;
    targetEntity: string;
    roleEntity: string;
    invitedBy: string;
    message?: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      // Check if membership already exists
      const existing = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (existing) {
        return { error: "Membership already exists" };
      }

      const membership = await this.prisma.membership.create({
        data: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity,
          roleEntity: input.roleEntity,
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
    memberEntity: string;
    targetEntity: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity,
          status: "invited"
        }
      });

      if (!membership) {
        return { error: "Invitation not found" };
      }

      const updated = await this.prisma.membership.update({
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
    memberEntity: string;
    targetEntity: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity,
          status: "invited"
        }
      });

      if (!membership) {
        return { error: "Invitation not found" };
      }

      const updated = await this.prisma.membership.update({
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
    memberEntity: string;
    targetEntity: string;
    approvedBy: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await this.prisma.membership.update({
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
    memberEntity: string;
    targetEntity: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await this.prisma.membership.update({
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
    memberEntity: string;
    targetEntity: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await this.prisma.membership.update({
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
    memberEntity: string;
    targetEntity: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await this.prisma.membership.update({
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
    memberEntity: string;
    targetEntity: string;
    roleEntity: string;
  }): Promise<{ membership: Membership } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      const updated = await this.prisma.membership.update({
        where: { id: membership.id },
        data: {
          roleEntity: input.roleEntity
        }
      });

      return { membership: updated };
    } catch (error) {
      return { error: `Failed to update role: ${error}` };
    }
  }

  async delete(input: {
    memberEntity: string;
    targetEntity: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });

      if (!membership) {
        return { error: "Membership not found" };
      }

      if (membership.isActive) {
        return { error: "Cannot delete active membership" };
      }

      await this.prisma.membership.delete({
        where: { id: membership.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete membership: ${error}` };
    }
  }

  // Queries
  async _getByMember(input: { memberEntity: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { memberEntity: input.memberEntity }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByTarget(input: { targetEntity: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { targetEntity: input.targetEntity }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByMemberAndTarget(input: {
    memberEntity: string;
    targetEntity: string;
  }): Promise<Membership[]> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity
        }
      });
      return membership ? [membership] : [];
    } catch {
      return [];
    }
  }

  async _getActiveByMember(input: { memberEntity: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: {
          memberEntity: input.memberEntity,
          isActive: true
        }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getActiveByTarget(input: { targetEntity: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: {
          targetEntity: input.targetEntity,
          isActive: true
        }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByRole(input: { roleEntity: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { roleEntity: input.roleEntity }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { status: input.status }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _getPendingInvitations(input: { memberEntity: string }): Promise<Membership[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: {
          memberEntity: input.memberEntity,
          status: "invited"
        }
      });
      return memberships;
    } catch {
      return [];
    }
  }

  async _isActiveMember(input: {
    memberEntity: string;
    targetEntity: string;
  }): Promise<boolean[]> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity,
          isActive: true
        }
      });
      return [!!membership];
    } catch {
      return [false];
    }
  }

  async _hasRole(input: {
    memberEntity: string;
    targetEntity: string;
    roleEntity: string;
  }): Promise<boolean[]> {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          memberEntity: input.memberEntity,
          targetEntity: input.targetEntity,
          roleEntity: input.roleEntity,
          isActive: true
        }
      });
      return [!!membership];
    } catch {
      return [false];
    }
  }
}
