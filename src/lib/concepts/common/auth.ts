import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type AuthUserPayload = {
  id: string;
  email: string;
  name: string;
  image: string;
  isActive: boolean;
  currentContext: { organizationId?: string; campaignId?: string; projectId?: string; teamId?: string };
  effectiveRole: Role | null;
  availableOrganizations: Array<{ id: string; name: string; domain: string; type: string; role: string }>;
};

export class AuthConcept {
  async buildCurrentUser(input: {
    userId: string;
    userEmail: string;
    userName: string;
    userImage: string;
    sessionKey: string;
  }): Promise<{ authUser: AuthUserPayload } | { error: string } > {
    try {
      console.log('building current user', input);
      // Determine role by environment heuristics
      const adminUsers = (process.env.ADMIN_USERS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      let isAdmin: boolean = false;
      if (input.userEmail && adminUsers.includes(input.userEmail.toLowerCase())) {
        isAdmin = true;
      } 

      // Get session current context
      let currentContext: Record<string, any> = {};
      if (input.sessionKey) {
        const session = await prisma.session.findFirst({ where: { sessionKey: input.sessionKey } });
        if (session?.currentContext) {
          try {
            currentContext = JSON.parse(session.currentContext);
          } catch {
            currentContext = { organizationId: session.currentContext };
          }
        }
      }
      const platformAdminRole = await prisma.role.findUnique({ where: { displayName_scope: { displayName: "Platform Admin", scope: "platform" } } });
      // Get user's active org memberships
      const memberships = await prisma.membership.findMany({
        where: {
          memberEntityType: "user",
          memberEntityId: input.userId,
          targetEntityType: "organization",
          isActive: true,
        },
      });
      console.log('memberships result', memberships);
      let role: Role | null = null;
      const availableOrganizations: AuthUserPayload["availableOrganizations"] = [];
      for (const membership of memberships) {
        console.log('membership', membership);
        const org = await prisma.organization.findUnique({ where: { id: membership.targetEntityId } });
        if (isAdmin) {
          role = platformAdminRole;
        } else {
          role = await prisma.role.findUnique({ where: { id: membership.roleEntityId } });
        }
        if (org) {
          console.log('adding org', org.id, org.name, org.domain, org.organizationType, role?.displayName.toLowerCase().replace(" ", "_"));
          availableOrganizations.push({ id: org.id, name: org.name, domain: org.domain, type: org.organizationType, role: role?.displayName.toLowerCase().replace(" ", "_") || "guest" });
        }
      }

      // If no current org context is set but user has orgs, set to first
      if (!currentContext.organizationId && memberships.length > 0 && input.sessionKey) {
        const firstOrgId = memberships[0].targetEntityId;
        currentContext = { organizationId: firstOrgId };
      }

      if (input.sessionKey) {
        await prisma.session.updateMany({
          where: { sessionKey: input.sessionKey },
          data: { currentContext: JSON.stringify(currentContext), lastActivityAt: new Date() },
        });
      }

      const authUser: AuthUserPayload = {
        id: input.userId,
        email: input.userEmail,
        name: input.userName || "User",
        image: input.userImage || "",
        isActive: true,
        currentContext,
        effectiveRole: role,
        availableOrganizations,
      };

      return { authUser };
    } catch (error) {
      return { error: `Failed to build current user: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async listUserOrganizations(input: { userId: string }): Promise<{ organizations: Array<{ id: string; name: string; domain: string; type: string; role: string }> } | { error: string }> {
    try {
      const memberships = await prisma.membership.findMany({
        where: { memberEntityType: "user", memberEntityId: input.userId, isActive: true },
      });
      const organizations: Array<{ id: string; name: string; domain: string; type: string; role: string }> = [];
      for (const m of memberships.filter((m) => m.targetEntityType === "organization")) {
        const org = await prisma.organization.findUnique({ where: { id: m.targetEntityId } });
        if (org) organizations.push({ id: org.id, name: org.name, domain: org.domain, type: org.organizationType, role: "member" });
      }
      return { organizations };
    } catch (error) {
      return { error: `Failed to list organizations: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async switchContext(input: { userId: string; contextId: string; sessionKey: string }): Promise<{ success: boolean; contextId?: string; error?: string }> {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          memberEntityType: "user",
          memberEntityId: input.userId,
          targetEntityType: "organization",
          targetEntityId: input.contextId,
          isActive: true,
        },
      });
      if (!membership) return { success: false, error: "User does not have access to this organization" };
      await prisma.session.updateMany({
        where: { sessionKey: input.sessionKey },
        data: { currentContext: JSON.stringify({ organizationId: input.contextId }), lastActivityAt: new Date() },
      });
      return { success: true, contextId: input.contextId };
    } catch (error) {
      return { success: false, error: `Failed to switch context: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
}


