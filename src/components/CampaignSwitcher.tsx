'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function CampaignSwitcher() {
  const { campaigns, currentCampaign, switchCampaign, isLoading } = useAuth() as any;
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const router = useRouter();

  if (!campaigns || campaigns.length <= 1) return null;

  const handleSwitch = async (id: string) => {
    if (id === currentCampaign?.id) { setIsOpen(false); return; }
    setIsBusy(true);
    try {
      await switchCampaign(id);
      setIsOpen(false);
    } finally {
      setIsBusy(false);
    }
  };
  
  const handleCreate = () => {
    setIsOpen(false);
    router.push('/campaigns?new=1');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        disabled={isBusy || isLoading}
      >
        <div className="flex flex-col items-start">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {currentCampaign?.name || 'Select Campaign'}
          </span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="py-1">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={handleCreate}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                disabled={isBusy}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Create Campaign</span>
              </button>
            </div>
            {/* divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              Switch Campaign
            </div>
            {campaigns.map((c: any) => (
              <button
                key={c.id}
                onClick={() => handleSwitch(c.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800 ${currentCampaign?.id === c.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}
                disabled={isBusy}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Role: {c.role.replace('_', ' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignSwitcher;


