'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LearnerPage from './LearnerPage';
import ManagerPage from './ManagerPage';
import ProviderPage from './ProviderPage';

export default function ApplicationsPage() {
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

  // Platform/Org admins and educators see manager view
  const isManager = hasRole(ROLES.PLATFORM_ADMIN) || 
                   hasRole(ROLES.ORG_ADMIN) || 
                   hasRole(ROLES.EDUCATOR);

  // Industry partners and experts see provider view  
  const isProvider = hasRole(ROLES.INDUSTRY_PARTNER) || 
                    hasRole(ROLES.EXPERT);

  if (isManager) {
    return <ManagerPage />;
  } else if (isProvider) {
    return <ProviderPage />;
  } else {
    return <LearnerPage />;
  }
}
