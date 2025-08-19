'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminPage from './AdminPage';

export default function OrganizationsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // If user is loaded and doesn't have admin permissions, redirect to home
    if (!isLoading && user) {
      const isAdmin = hasRole(ROLES.PLATFORM_ADMIN) || 
                     hasRole(ROLES.MANAGER);
      
      if (!isAdmin) {
        router.push('/');
      }
    }
  }, [user, isLoading, hasRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Only admins should see organization management
  const isAdmin = hasRole(ROLES.PLATFORM_ADMIN) || 
                 hasRole(ROLES.MANAGER);

  if (isAdmin) {
    return <AdminPage />;
  }

  return null; // Will redirect to home
}
