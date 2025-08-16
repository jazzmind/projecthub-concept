'use client';

import { useState } from 'react';
import { useOrganizationSwitcher } from '@/lib/auth-context';

interface Organization {
  id: string;
  name: string;
  domain: string;
  type: string;
  role: string;
}

export function OrganizationSwitcher() {
  const { organizations, currentOrganization, switchOrganization } = useOrganizationSwitcher();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchOrganization = async (orgId: string) => {
    if (orgId === currentOrganization?.id) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await switchOrganization(orgId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (organizations.length <= 1) {
    return null; // Don't show switcher if user only has access to one organization
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading}
      >
        <div className="flex flex-col items-start">
          <span className="font-medium text-gray-900">
            {currentOrganization?.name || 'Select Organization'}
          </span>
          <span className="text-xs text-gray-500">
            {currentOrganization?.role && (
              `Role: ${currentOrganization.role.replace('_', ' ')}`
            )}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Switch Organization
            </div>
            {organizations.map((org: Organization) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrganization(org.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                  currentOrganization?.id === org.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-900'
                }`}
                disabled={isLoading}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-gray-500">
                    {org.domain} • {org.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    {org.type} organization
                  </span>
                </div>
                {currentOrganization?.id === org.id && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationSwitcher;
