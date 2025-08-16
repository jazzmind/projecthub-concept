import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";


export const auth = betterAuth({
  // Database adapter
  // Async by nature: Better Auth persists users/sessions/verification to DB
  // through Prisma. All auth APIs that touch DB or crypto are async.
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    // Email/password flows are handled by Better Auth. Enabling
    // verification ensures a consistent security baseline.
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        // Async: sending email is an IO operation. We lazily import the service
        // so clients never bundle server-only modules like nodemailer.
        const { sendOTP } = await import("@/lib/email-service");
        await sendOTP(email, otp, type);
      },
    }),
  ],
  session: {
    // Session rolling/expiry settings: used by Better Auth to compute cookie
    // expiry and DB session state. No direct async here, but consumed by
    // async auth APIs.
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    changeEmail: {
      enabled: true,
      requireEmailVerification: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  callbacks: {
    user: {
      create: async ({ user }: { user: any }) => {
        // Auto-registration bootstrap
        //
        // Called by Better Auth after creating a new auth user.
        // This bridge synchronizes the new identity with the concept system
        // using environment-driven defaults. It is intentionally lenient:
        // failures are logged but never break the auth flow.
        //
        // Async: imports concept facade and performs DB-backed operations
        // through concept actions behind the scenes.
        const email = user.email;
        const autoRegisterDomain = process.env.AUTO_REGISTER_DOMAIN;
        // if the email does not end with AUTO_REGISTER_DOMAIN, then we don't auto-register
        if (autoRegisterDomain && !email.endsWith(`@${autoRegisterDomain}`)) {
          return user;
        }
        // Determine the role based on email
        let role = 'manager'; // default role
        const adminUsers = (process.env.ADMIN_USERS || "").split(",").map(e => e.trim());
        if (adminUsers.includes(email)) {
          role = 'platform_admin';
        } 
        
        // Create the user in our concept system via the bridge
        try {
          const { User, Role, Membership, Organization } = await import("@/lib/server");

          // Ensure default organization exists (use valid org type)
          const org = await Organization._getByDomain({ domain: autoRegisterDomain } as any);
          let platformOrg = org[0];
          if (!platformOrg) {
            return user;
          }
          const roleEntity = await Role._getByDisplayName({ displayName: role });
          if (!roleEntity) {
            return user;
          }

          // Create the user in our concept system (mapping Better Auth fields to concept fields)
          // Field mapping strategy:
          // - Better Auth 'image' field -> User concept 'image' field 
          // - emailVerified is set true for OAuth users since they're pre-verified
          const userResult = await User.register({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image, // Map Better Auth 'image' field to our 'image' concept field
            emailVerified: user.emailVerified || true // OAuth users are considered verified
          });
          
          if ('error' in userResult) {
            // If user already exists in concept system, continue bootstrap
            if (!String(userResult.error).toLowerCase().includes('already exists')) {
              console.error('Failed to create user in concept system:', userResult.error);
            }
          }
          
          const invite = await Membership.invite({
            memberEntityType: 'user',
            memberEntityId: user.id,
            targetEntityType: 'organization',
            targetEntityId: (platformOrg as any).organization || (platformOrg as any).id,
            roleEntityId: roleEntity.id,
            invitedBy: 'system'
          });
          
          if ('error' in invite) {
            console.error('Failed to invite user to organization:', invite.error);
          }
          
          if ('membership' in invite) {
            await Membership.approve({
              memberEntityType: 'user',
              memberEntityId: user.id,
              targetEntityType: 'organization',
              targetEntityId: (platformOrg as any).organization || (platformOrg as any).id,
              approvedBy: 'system',
            });
          }
                  
          console.log(`Auto-registered user ${email} with role ${role}`);
        } catch (error) {
          console.error('Error in auto-registration:', error);
          // Don't fail the auth process, just log the error
        }
        
        return user;
      },
    },
  },
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
