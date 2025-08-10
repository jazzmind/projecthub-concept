import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

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
      sendOTP: async ({ email, otp, type }) => {
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || "smtp.gmail.com",
          port: parseInt(process.env.EMAIL_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const subject = type === "email-verification" 
          ? "Verify your ProjectHub email" 
          : "Your ProjectHub login code";
        
        const html = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #2563eb;">ProjectHub</h2>
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; text-align: center; color: #1f2937;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent from ProjectHub. Please do not reply to this email.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"ProjectHub" <${process.env.EMAIL_USER}>`,
          to: email,
          subject,
          html,
        });
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
  const user = users[0];

  if (!user) {
    return null;
  }

  return {
    ...session.user,
    ...user,
    isAdmin: user.platformRole === "admin" || await isAdminUser(user.email),
  };
}

export type SessionUser = Awaited<ReturnType<typeof getCurrentUser>>;

export const { GET, POST } = auth.handler;
