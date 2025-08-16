'use client';

import { createAuthClient } from "better-auth/react";

/**
 * Auth Client (Browser)
 *
 * Purpose
 *   - Provide convenient client-side helpers for Better Auth interactions
 *     (sign-in/out, sign-up, OTP), keeping server-only code out of the bundle.
 *
 * Sync vs Async
 *   - `createAuthClient` sets up client-bound methods that internally perform
 *     network requests (async). Our helpers like `signInWithGoogle`,
 *     `sendEmailOtp`, and `verifyEmailOtp` are async because they call HTTP
 *     endpoints and may trigger cookie updates.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
  plugins: [
    // Client-side plugins if needed
  ]
});

export const { useSession, signIn, signOut, signUp } = authClient;

// Google OAuth sign-in function
export async function signInWithGoogle() {
  return await signIn.social({
    provider: 'google',
    callbackURL: window.location.origin + '/dashboard', // Redirect to dashboard after OAuth
  });
}

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

  const json = await response.json();
  // After successful OTP sign-in, ensure cookies are set before app queries current-user
  if (response.ok) {
    // Small delay to allow cookie propagation, then hard reload to re-run client bootstrap
    setTimeout(() => {
      window.location.replace('/dashboard');
    }, 50);
  }
  return json;
}
