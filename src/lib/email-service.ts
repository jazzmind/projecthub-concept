// Server-side only email service
//
// Purpose
//   - Provide a minimal, server-only SMTP sender for Better Auth OTP flows.
//   - Isolated here to avoid bundling nodemailer on the client.
//
// Sync vs Async
//   - SMTP operations are async IO; `sendOTP` is async and awaited by the
//     Better Auth plugin callback.
//   - Guard against client usage by throwing if `window` is defined.
//
// Configuration
//   - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are required.
//   - Use provider-specific app passwords where necessary (e.g., Gmail).
//
// Security
//   - Do not log OTP values or PII beyond what is necessary for delivery.
//   - Templates should remain generic and not leak environment details.
import nodemailer from "nodemailer";

export async function sendOTP(email: string, otp: string, type: 'email-verification' | 'sign-in' | 'forget-password') {
  // Only run on server side
  if (typeof window !== 'undefined') {
    throw new Error('Email service can only be used on server side');
  }

  const transporter = nodemailer.createTransport({
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
    : type === "forget-password"
    ? "Reset your ProjectHub password"
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
}
