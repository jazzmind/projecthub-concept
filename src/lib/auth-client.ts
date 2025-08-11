'use client';

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
  plugins: [
    // Client-side plugins if needed
  ]
});

export const { useSession, signIn, signOut, signUp } = authClient;

// Email OTP functions using fetch API directly
export async function sendEmailOtp(email: string, type: 'sign-in' | 'email-verification' = 'sign-in') {
  const response = await fetch('/api/auth/email-otp/send-verification-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, type }),
  });
  
  return await response.json();
}

export async function verifyEmailOtp(email: string, otp: string) {
  const response = await fetch('/api/auth/sign-in/email-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });
  
  return await response.json();
}
