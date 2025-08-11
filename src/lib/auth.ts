import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        // Dynamically import the email service to avoid bundling nodemailer in client
        const { sendOTP } = await import("@/lib/email-service");
        await sendOTP(email, otp, type);
      },
    }),
  ],
  session: {
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
    generateId: () => crypto.randomUUID(),
  },
});

// Helper function to check if user is admin
export async function isAdminUser(email: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_USERS || "").split(",").map(e => e.trim());
  return adminEmails.includes(email);
}

// Helper function to get current user with organization context
export async function getCurrentUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return null;
  }

  // Get user with additional data from our User concept
  const { User } = await import("@/lib/server");
  const users = await User._getById({ id: session.user.id });
  const user = users[0] as any; // Type assertion since Prisma types may not be complete

  if (!user) {
    return null;
  }

  return {
    ...session.user,
    ...user,
    isAdmin: (user.platformRole === "admin") || await isAdminUser(user.email),
  };
}

export type SessionUser = Awaited<ReturnType<typeof getCurrentUser>>;

export const GET = auth.handler;
export const POST = auth.handler;
