// Server-side only email service
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
