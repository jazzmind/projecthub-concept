'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LearnerPage from './LearnerPage';
import ManagerPage from './ManagerPage';

export default function ProvidersPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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

  // Check if user has management permissions
  const isManager = hasRole(ROLES.PLATFORM_ADMIN) || 
                   hasRole(ROLES.ORG_ADMIN) || 
                   hasRole(ROLES.EDUCATOR) ||
                   hasRole(ROLES.EXPERT) ||
                   hasRole(ROLES.INDUSTRY_PARTNER);

  if (isManager) {
    return <ManagerPage />;
  } else {
    return <LearnerPage />;
  }
}
