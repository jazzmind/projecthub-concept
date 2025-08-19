'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LearnerPage from './LearnerPage';
import ManagerPage from './ManagerPage';
import ProviderPage from '../applications/ProviderPage';

export default function ProjectsPage() {
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
  
  if (hasRole(ROLES.EDUCATOR) || hasRole(ROLES.MANAGER) || hasRole(ROLES.PLATFORM_ADMIN)) {
    return <ManagerPage />;
  } else if (hasRole(ROLES.LEARNER)) {
    return <LearnerPage />;
  } else if (hasRole(ROLES.PROVIDER) || hasRole(ROLES.EXPERT)) {
    return <ProviderPage />;
  } else {
    return <div>No access</div>;
  }
}
