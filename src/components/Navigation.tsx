'use client';

import { 
  useAuth, 
  useIsAdmin, 
  useHasRole, 
  useHasPermission,
  useCanCreateOrganizations,
  useCanCreateCampaigns,
  useCanCreateProjects,
  ROLES
} from '@/lib/auth-context';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import OrganizationSwitcher from './OrganizationSwitcher';

export default function Navigation() {
  const { user, currentOrganization, logout, isLoading, viewAsRole, setViewAsRole } = useAuth();
  const isAdmin = useIsAdmin();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyProjects, setShowMyProjects] = useState(false);

    
  console.log('user', user);

  if (isLoading) {
    return (
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a href='/' className="flex items-center space-x-2 whitespace-nowrap">
                <Image src="/logo.png" alt="ProjectHub" width={32} height={32} />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ProjectHub</h1>
              </a>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-10 flex-1">
              <div className="flex items-center space-x-4">
              <a href='/' className="flex items-center space-x-2 whitespace-nowrap">
                <Image src="/logo.png" alt="ProjectHub" width={32} height={32} />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ProjectHub</h1>
              </a>
                  </div>
              <nav className="hidden md:flex space-x-8 mx-auto">
                <a href="/#companies" className="nav-item px-4 py-2 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 text-sm font-semibold transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">For Companies</a>
                <a href="/#educators" className="nav-item px-4 py-2 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 text-sm font-semibold transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">For Educators</a>
                <a href="/#students" className="nav-item px-4 py-2 text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 text-sm font-semibold transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">For Students</a>
              </nav>
            </div>
            <a href="/login" className="inline-flex items-center px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-medium text-sm transition-all">
              Sign In
            </a>
          </div>
        </div>
      </header>
    );
  }

  // Navigation items based on user permissions and roles
  const getNavigationItems = () => {
    const items = [
      { href: '/dashboard', label: 'Dashboard', show: true },
    ];

    // Check specific permissions for each navigation item
    const canReadOrganizations = useHasPermission('organizations', 'read');
    const canReadCampaigns = useHasPermission('campaigns', 'read');
    const canReadProjects = useHasPermission('projects', 'read');
    const canReadTeams = useHasPermission('teams', 'read');
    const canReadProfiles = useHasPermission('profiles', 'read');

    if (canReadOrganizations) {
      items.push({ href: '/organizations', label: 'Organizations', show: true });
    }

    if (canReadCampaigns) {
      items.push({ href: '/campaigns', label: 'Campaigns', show: true });
    }

    if (canReadProjects) {
      items.push({ href: '/projects', label: 'Projects', show: true });
    }

    if (canReadTeams) {
      items.push({ href: '/teams', label: 'Teams', show: true });
    }

    if (canReadProfiles) {
      // Show different labels based on role
      const hasExpertRole = useHasRole(ROLES.EXPERT);
      const hasIndustryPartnerRole = useHasRole(ROLES.INDUSTRY_PARTNER);
      
      if (isAdmin) {
        items.push(
          { href: '/experts', label: 'Experts', show: true },
          { href: '/providers', label: 'Providers', show: true }
        );
      } else if (hasExpertRole || hasIndustryPartnerRole) {
        items.push({ href: '/experts', label: 'Experts', show: true });
      }
    }

    // Admin-only items
    if (isAdmin) {
      items.push({ href: '/users', label: 'Users', show: true });
    }

    return items.filter(item => item.show);
  };

  // Logged-in primary navigation
  const navigationItems = [
    { href: '/projects', label: 'Browse Projects' },
    { href: '/projects?mine=1', label: 'My Projects' },
  ];

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <a href='/'>
                <Image src="/logo.png" alt="ProjectHub" width={32} height={32} />
              </a>

              <div className="flex items-center space-x-4">
                {currentOrganization ? (
                  <>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={currentOrganization.name}>
                      {currentOrganization.name}
                    </span>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                      Create Campaign
                    </button>
                  </>
                ) : (
                  <a href='/' className="flex items-center space-x-2 whitespace-nowrap">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">ProjectHub</h1>
                  </a>
                )}
              </div>
            </div>

            {/* Organization Switcher */}
            <OrganizationSwitcher />
          </div>

          {/* Center Navigation / Search */}  
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-12 pr-32 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 space-x-2">
                  <button
                    onClick={() => setShowMyProjects(!showMyProjects)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      showMyProjects 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    My Projects
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <select
                    className="bg-transparent border-0 text-sm text-gray-600 dark:text-gray-400 focus:ring-0 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              {currentOrganization && (
                <>
                  <span className="font-medium">{currentOrganization.name}</span>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <span>Campaign Name</span>
                </>
              )}
            </div>
          {/* <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav> */}

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {viewAsRole ? (
                          <>Viewing as: {viewAsRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</>
                        ) : (
                          user.effectiveRole.displayName
                        )}
                      </span>
                      {viewAsRole && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          VIEW AS
                    </span>
                  )}
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {user.effectiveRole.displayName}
                    </div>
                    {currentOrganization && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                        {currentOrganization.name}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <a
                      href="/profile"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </a>
                    <a
                      href="/settings"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </a>
                    
                    {/* View As Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">View As</div>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setViewAsRole(null);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                            !viewAsRole 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {user?.effectiveRole.displayName} (Your Role)
                        </button>
                        
                        {/* Only show other roles if user has higher permissions */}
                        {(user?.effectiveRole.name === ROLES.PLATFORM_ADMIN || user?.effectiveRole.name === ROLES.ORG_ADMIN) && (
                          <>
                            <button
                              onClick={() => {
                                setViewAsRole(ROLES.EDUCATOR);
                                setShowUserMenu(false);
                              }}
                              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                                viewAsRole === ROLES.EDUCATOR 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Educator
                            </button>
                            <button
                              onClick={() => {
                                setViewAsRole(ROLES.LEARNER);
                                setShowUserMenu(false);
                              }}
                              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                                viewAsRole === ROLES.LEARNER 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Learner
                            </button>
                            <button
                              onClick={() => {
                                setViewAsRole(ROLES.INDUSTRY_PARTNER);
                                setShowUserMenu(false);
                              }}
                              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                                viewAsRole === ROLES.INDUSTRY_PARTNER 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Industry Partner
                            </button>
                          </>
                        )}
                        
                        {/* Educators can view as learner */}
                        {user?.effectiveRole.name === ROLES.EDUCATOR && (
                          <button
                            onClick={() => {
                              setViewAsRole(ROLES.LEARNER);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                              viewAsRole === ROLES.LEARNER 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            Learner
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
