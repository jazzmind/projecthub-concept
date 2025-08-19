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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 30, // 30 minutes (reduced from 1 day for more frequent refresh)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 30, // 30 minutes (increased from 5 minutes)
    },
  },
  databaseHooks: {
    // Ensure a single concept session per user and initialize currentContext
    session: {
      create: {
        after: async (row: any) => {
          try {
            console.log('Session create hook triggered:', { userId: row.userId, sessionId: row.id });
            
            // Better Auth session row
            const token: string = row.id; // session token
            const userId: string = row.userId;
            
            // Enforce single concept session per user
            console.log('Deleting existing sessions for user:', userId);
            await prisma.session.deleteMany({ where: { userId } });

            // Determine defaults from memberships
            console.log('Looking up memberships for user:', userId);
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

            console.log('Found memberships:', { 
              org: orgMembership?.targetEntityId, 
              campaign: campaignMembership?.targetEntityId 
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

            console.log('Creating session with context:', context);
            
            const sessionResult = await prisma.session.create({
              data: {
                sessionKey: token,
                userId,
                currentContext: JSON.stringify(context),
                loginMethod: 'oauth',
                isActive: true,
              },
            });
            
            console.log('Session created successfully:', sessionResult.id);
          } catch (e) {
            console.error('databaseHooks.session.create.after error:', e);
            console.error('Error details:', {
              message: e instanceof Error ? e.message : 'Unknown error',
              stack: e instanceof Error ? e.stack : undefined,
              userId: row.userId,
              sessionId: row.id
            });
          }
        },
      },
      update: {
        after: async (row: any) => {
          try {
            const token: string = row.id;
            const userId: string = row.userId;
            console.log('Session update hook triggered:', { userId, sessionId: token });
            await prisma.session.updateMany({ where: { userId }, data: { sessionKey: token, lastActivityAt: new Date() } });
            console.log('Session updated successfully');
          } catch (error) {
            console.error('Session update hook error:', error);
          }
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
        console.log('CustomSession plugin called for user:', user.id, user.email);
        
        // Load our concept session by Better Auth userId
        let conceptSession = await prisma.session.findFirst({ where: { userId: session.userId } });
        console.log('Found concept session:', conceptSession ? 'yes' : 'no', conceptSession?.id);
        
        // If no concept session exists, try to create one
        if (!conceptSession) {
          console.log('No concept session found, attempting to create one');
          conceptSession = await ensureSessionContext(session.userId, user.email);
        }
        
        let currentContext: any = {};
        if (conceptSession?.currentContext) {
          try { 
            currentContext = JSON.parse(conceptSession.currentContext); 
            console.log('Parsed currentContext:', currentContext);
          } catch (parseError) {
            console.error('Failed to parse currentContext:', parseError);
          }
        }
        
        // Check admin status
        const isAdmin = await isAdminUser(user.email);
        console.log('Is admin user?', isAdmin);
        if (isAdmin) {
          currentContext.currentRole = 'platform_admin';
        }
        
        // Derive effectiveRole from currentRole / Role table
        let effectiveRole = { name: 'guest', displayName: 'Guest', scope: 'organization', permissions: {} as Record<string, any> };
        if (currentContext.currentRole) {
          const displayName = currentContext.currentRole.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          console.log('Looking up role:', displayName);
          const roleRecord = await prisma.role.findFirst({ where: { displayName: { equals: displayName, mode: 'insensitive' } } });
          if (roleRecord) {
            effectiveRole = { name: currentContext.currentRole, displayName: roleRecord.displayName, scope: 'organization', permissions: (roleRecord.permissions as any) || {} };
            console.log('Found role record:', roleRecord.displayName);
          } else {
            effectiveRole = { name: currentContext.currentRole, displayName, scope: 'organization', permissions: {} };
            console.log('No role record found, using default');
          }
        }
        
        // get memberships for the user
        const memberships = await prisma.membership.findMany({ where: { memberEntityType: 'user', memberEntityId: user.id, targetEntityType: 'organization', isActive: true } });
        console.log('Found memberships:', memberships.length);
        
        const availableOrganizations = await prisma.organization.findMany({ where: { id: { in: memberships.map(m => m.targetEntityId) } } });
        console.log('Found organizations:', availableOrganizations.length);
        
        const result = { user, session, currentContext, effectiveRole, availableOrganizations };
        console.log('CustomSession returning:', { 
          hasContext: !!currentContext.organizationId, 
          role: effectiveRole.name,
          orgCount: availableOrganizations.length 
        });
        
        return result as any;
      } catch (error) {
        console.error('CustomSession error:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          userId: session.userId,
          userEmail: user.email
        });
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

// Helper function to ensure session context exists for a user
export async function ensureSessionContext(userId: string, userEmail: string) {
  try {
    console.log('Ensuring session context for user:', userId);
    
    // Check if concept session already exists
    const existingSession = await prisma.session.findFirst({ where: { userId } });
    if (existingSession) {
      console.log('Session context already exists');
      return existingSession;
    }

    console.log('Creating missing session context');
    
    // Look up user's memberships
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

    // Determine role
    let currentRole = 'member';
    if (await isAdminUser(userEmail)) {
      currentRole = 'platform_admin';
    } else if (orgMembership?.roleEntityId) {
      const role = await prisma.role.findUnique({ where: { id: orgMembership.roleEntityId } });
      if (role?.displayName) currentRole = role.displayName.toLowerCase().replace(/\s+/g, '_');
    }

    // Build context
    const context: Record<string, any> = {};
    if (orgMembership) context.organizationId = orgMembership.targetEntityId;
    if (campaignMembership) context.campaignId = campaignMembership.targetEntityId;
    context.currentRole = currentRole;

    // Create session
    const session = await prisma.session.create({
      data: {
        sessionKey: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        currentContext: JSON.stringify(context),
        loginMethod: 'oauth',
        isActive: true,
      },
    });

    console.log('Session context created:', session.id);
    return session;
    
  } catch (error) {
    console.error('Failed to ensure session context:', error);
    return null;
  }
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
