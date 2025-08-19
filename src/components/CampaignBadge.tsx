'use client';

import { useAuth } from '@/lib/auth-context';

export function CampaignBadge() {
  const { currentCampaign } = useAuth() as any;

  if (!currentCampaign) return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
      No campaign
    </span>
  );

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      title={`Role: ${currentCampaign.role}`}
    >
      {currentCampaign.name}
    </span>
  );
}

export default CampaignBadge;


