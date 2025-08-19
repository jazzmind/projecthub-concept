'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import ManagerPage from './ManagerPage';
import PublicPage from './PublicPage';

export default function CampaignsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user, show public view
  if (!user) {
    return <PublicPage />;
  }

  // Check if user has management permissions
  const isManager = hasRole(ROLES.PLATFORM_ADMIN) || 
                   hasRole(ROLES.MANAGER) || 
                   hasRole(ROLES.EDUCATOR) ||
                   hasRole(ROLES.EXPERT) ||
                   hasRole(ROLES.PROVIDER);

  if (isManager) {
    return <ManagerPage />;
  } else {
    // Learners see public view of campaigns
    return <PublicPage />;
  }
}