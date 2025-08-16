'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ManagerPage from './ManagerPage';

export default function TeamsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // If user is loaded and doesn't have manager permissions, redirect to projects
    if (!isLoading && user) {
      const isManager = hasRole(ROLES.PLATFORM_ADMIN) || 
                       hasRole(ROLES.ORG_ADMIN) || 
                       hasRole(ROLES.EDUCATOR) ||
                       hasRole(ROLES.EXPERT) ||
                       hasRole(ROLES.INDUSTRY_PARTNER) ||
                       hasRole(ROLES.TEAM_LEADER);
      
      if (!isManager) {
        router.push('/projects');
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

  // Only managers and team leaders should see team management
  const isManager = hasRole(ROLES.PLATFORM_ADMIN) || 
                   hasRole(ROLES.ORG_ADMIN) || 
                   hasRole(ROLES.EDUCATOR) ||
                   hasRole(ROLES.EXPERT) ||
                   hasRole(ROLES.INDUSTRY_PARTNER) ||
                   hasRole(ROLES.TEAM_LEADER);

  if (isManager) {
    return <ManagerPage />;
  }

  return null; // Will redirect to projects
}