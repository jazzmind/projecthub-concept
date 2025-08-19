import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { customSession } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

// Better Auth configuration using databaseHooks + customSession
// - No next-auth style callbacks
// - Prisma adapter drives Better Auth core tables (AuthSession etc.)
// - We maintain our own concept `session` table to store currentContext { organizationId, campaignId, currentRole }
// - We enrich the session payload using the customSession plugin so client/server can read RBAC context

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  databaseHooks: {
    // Ensure a single concept session per user and initialize currentContext
    session: {
      create: {
        after: async (row: any) => {
          try {
            // Better Auth session row
            const token: string = row.id; // session token
            const userId: string = row.userId;
            // Enforce single concept session per user
            await prisma.session.deleteMany({ where: { userId } });

            // Determine defaults from memberships
            const orgMembership = await prisma.membership.findFirst({
              where: {
                memberEntityType: 'user',
                memberEntityId: userId,
                targetEntityType: 'organization',
                isActive: true,
              },
              orderBy: { joinedAt: 'asc' },
            });
            const campaignMembership = await prisma.membership.findFirst({
              where: {
                memberEntityType: 'user',
                memberEntityId: userId,
                targetEntityType: 'campaign',
                isActive: true,
              },
              orderBy: { joinedAt: 'asc' },
            });

            let currentRole = 'member';
            if (orgMembership?.roleEntityId) {
              const role = await prisma.role.findUnique({ where: { id: orgMembership.roleEntityId } });
              if (role?.displayName) currentRole = role.displayName.toLowerCase().replace(/\s+/g, '_');
            }

            const context: Record<string, any> = {};
            if (orgMembership) context.organizationId = orgMembership.targetEntityId;
            if (campaignMembership) context.campaignId = campaignMembership.targetEntityId;
            context.currentRole = currentRole;

            await prisma.session.create({
              data: {
                sessionKey: token,
                userId,
                currentContext: JSON.stringify(context),
                loginMethod: 'oauth',
                isActive: true,
              },
            });
          } catch (e) {
            console.error('databaseHooks.session.create.after error:', e);
          }
        },
      },
      update: {
        after: async (row: any) => {
          try {
            const token: string = row.id;
            const userId: string = row.userId;
            await prisma.session.updateMany({ where: { userId }, data: { sessionKey: token, lastActivityAt: new Date() } });
          } catch {}
        },
      },
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { sendOTP } = await import("@/lib/email-service");
        await sendOTP(email, otp, type);
      },
    }),
    // Enrich session response with our concept session.currentContext and effectiveRole
    customSession(async ({ user, session }) => {
      try {
        // Load our concept session by Better Auth userId
        const conceptSession = await prisma.session.findFirst({ where: { userId: session.userId } });
        let currentContext: any = {};
        if (conceptSession?.currentContext) {
          try { currentContext = JSON.parse(conceptSession.currentContext); } catch {}
        }
        if (await isAdminUser(user.email)) {
          currentContext.currentRole = 'platform_admin';
        }
        // Derive effectiveRole from currentRole / Role table
        let effectiveRole = { name: 'guest', displayName: 'Guest', scope: 'organization', permissions: {} as Record<string, any> };
        if (currentContext.currentRole) {
          const displayName = currentContext.currentRole.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          const roleRecord = await prisma.role.findFirst({ where: { displayName: { equals: displayName, mode: 'insensitive' } } });
          if (roleRecord) {
            effectiveRole = { name: currentContext.currentRole, displayName: roleRecord.displayName, scope: 'organization', permissions: (roleRecord.permissions as any) || {} };
          } else {
            effectiveRole = { name: currentContext.currentRole, displayName, scope: 'organization', permissions: {} };
          }
        }
        // get memberships for the user
        const memberships = await prisma.membership.findMany({ where: { memberEntityType: 'user', memberEntityId: user.id, targetEntityType: 'organization', isActive: true } });
        const availableOrganizations = await prisma.organization.findMany({ where: { id: { in: memberships.map(m => m.targetEntityId) } } });
        return { user, session, currentContext, effectiveRole, availableOrganizations } as any;
      } catch {
        return { user, session } as any;
      }
    }),
  ],
});

// Helper function to check if user is admin
export async function isAdminUser(email: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_USERS || "").split(",").map(e => e.trim());
  return adminEmails.includes(email);
}

// Helper function to get current user with organization context
export async function getCurrentUser(request: Request) {
  // Async: session lookup via Better Auth
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return null;
  }
  
  // For better-auth integration, we return the session user
  // Extended user data will be handled by the sync bridge
  return {
    ...session.user,
    isAdmin: await isAdminUser(session.user.email),
  };
}

export type SessionUser = Awaited<ReturnType<typeof getCurrentUser>>;

export const GET = auth.handler;
export const POST = auth.handler;
