'use client';

import { useAuth, useIsAdmin, useHasRole } from '@/lib/auth-context';
import { useState } from 'react';
import NotificationBell from '@/components/NotificationBell';

export default function Navigation() {
  const { user, currentOrganization, logout, isLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ProjectHub</h1>
            </div>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ProjectHub</h1>
            </div>
            <a href="/login" className="btn btn-primary">
              Sign In
            </a>
          </div>
        </div>
      </header>
    );
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      { href: '/dashboard', label: 'Dashboard', show: true },
    ];

    // Admin sees everything
    if (isAdmin) {
      items.push(
        { href: '/organizations', label: 'Organizations', show: true },
        { href: '/campaigns', label: 'Campaigns', show: true },
        { href: '/teams', label: 'Teams', show: true },
        { href: '/projects', label: 'Projects', show: true },
        { href: '/partners', label: 'Partners', show: true },
        { href: '/experts', label: 'Experts', show: true },
        { href: '/users', label: 'Users', show: true }
      );
    } else {
      // Role-based navigation for regular users
      const hasEducatorRole = useHasRole('educator');
      const hasExpertRole = useHasRole('expert');
      const hasIndustryPartnerRole = useHasRole('industry_partner');
      const hasLearnerRole = useHasRole('learner');

      if (hasEducatorRole) {
        items.push(
          { href: '/campaigns', label: 'Campaigns', show: true },
          { href: '/teams', label: 'Teams', show: true },
          { href: '/projects', label: 'Projects', show: true }
        );
      }

      if (hasExpertRole) {
        items.push(
          { href: '/projects', label: 'Projects', show: true },
          { href: '/teams', label: 'Teams', show: true }
        );
      }

      if (hasIndustryPartnerRole) {
        items.push(
          { href: '/projects', label: 'Projects', show: true },
          { href: '/campaigns', label: 'Campaigns', show: true }
        );
      }

      if (hasLearnerRole) {
        items.push(
          { href: '/projects', label: 'Projects', show: true },
          { href: '/teams', label: 'My Teams', show: true }
        );
      }
    }

    return items.filter(item => item.show);
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">
              <a href="/dashboard">ProjectHub</a>
            </h1>
            
            {/* Current Organization Selector */}
            {currentOrganization && (
              <div className="relative">
                <button
                  onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <span>{currentOrganization.name}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showOrgDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900">{currentOrganization.name}</div>
                      <div className="text-xs text-gray-500">{currentOrganization.type}</div>
                    </div>
                    <div className="p-1">
                      <a
                        href="/organizations/switch"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => setShowOrgDropdown(false)}
                      >
                        Switch Organization
                      </a>
                      {isAdmin && (
                        <a
                          href="/organizations/manage"
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          onClick={() => setShowOrgDropdown(false)}
                        >
                          Manage Organizations
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />
            
            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">{user.name}</span>
                {isAdmin && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Admin
                  </span>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
