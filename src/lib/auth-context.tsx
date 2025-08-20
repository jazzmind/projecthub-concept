'use client';

import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Auth Context (Client)
 *
 * Purpose
 *   - Provide a React-friendly context for auth state, permissions, roles and
 *     organization context switching. This is the client counterpart to our
 *     concept-driven RBAC which lives on the server via synchronizations.
 *
 * Data Flow
 *   - On first load, the provider attempts to fetch a minimal current user via
 *     sync-backed API endpoints (`/api/auth/current-user`, `/api/auth/organizations`).
 *     These API routes ultimately consult the concept engine to derive effective
 *     role, contexts and permissions based on Membership/Role/Session state.
 *   - The provider exposes helpers for permissions and role checks that operate
 *     purely in-memory on the fetched user payload (sync). This keeps rendering
 *     fast and deterministic on the client.
 *
 * Sync vs Async
 *   - Async: Initial `fetchUser`, `switchOrganization`, and `logout` perform
 *     network calls to the API endpoints; they are async side effects.
 *   - Sync: Permission and role checks (`hasPermission`, `hasRole`, `hasAnyRole`)
 *     are synchronous pure computations on the current state to avoid re-renders
 *     and keep UI logic straightforward.
 *
 * See also
 *   - docs/auth-usage.md for example usage patterns in components and routes
 *   - docs/RBAC-EXAMPLE.md for the generic RBAC model and context rules
 */

// Auth user interface - moved from auth-rbac
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string;
  isActive: boolean;
  currentContext: {
    organizationId?: string;
    campaignId?: string;
    projectId?: string;
    teamId?: string;
  };
  effectiveRole: {
    name: string;
    displayName: string;
    scope: string;
    permissions: Record<string, any>;
  };
  availableOrganizations: Array<{ id: string; name: string; domain: string; type: string; role: string }>;
}

// Permission constants
export const PERMISSIONS = {
  ORGANIZATIONS: {
    CREATE: 'organizations.create',
    READ: 'organizations.read',
    UPDATE: 'organizations.update',
    DELETE: 'organizations.delete',
    MANAGE_MEMBERS: 'organizations.manage_members'
  },
  CAMPAIGNS: {
    CREATE: 'campaigns.create',
    READ: 'campaigns.read',
    UPDATE: 'campaigns.update',
    DELETE: 'campaigns.delete',
    PUBLISH: 'campaigns.publish'
  },
  PROJECTS: {
    CREATE: 'projects.create',
    READ: 'projects.read',
    UPDATE: 'projects.update',
    DELETE: 'projects.delete',
    ASSIGN: 'projects.assign'
  },
  TEAMS: {
    CREATE: 'teams.create',
    READ: 'teams.read',
    UPDATE: 'teams.update',
    DELETE: 'teams.delete',
    MANAGE_MEMBERS: 'teams.manage_members'
  },
  PROFILES: {
    CREATE: 'profiles.create',
    READ: 'profiles.read',
    UPDATE: 'profiles.update',
    DELETE: 'profiles.delete',
    VERIFY: 'profiles.verify'
  }
} as const;

// Role constants
export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  MANAGER: 'manager',
  EDUCATOR: 'educator',
  EXPERT: 'expert',
  PROVIDER: 'provider',
  LEARNER: 'learner',
  GUEST: 'guest'
} as const;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  organizations: Array<{
    id: string;
    name: string;
    domain: string;
    type: string;
    role: string;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  currentOrganization: any | null;
  currentCampaign: any | null;
  viewAsRole: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
  switchCampaign: (campaignId: string) => Promise<void>;
  setViewAsRole: (role: string | null) => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: AuthUser | null }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Array<{
    id: string;
    name: string;
    domain: string;
    type: string;
    role: string;
  }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{
    id: string;
    name: string;
    role: string;
  }>>([]);
  const [currentOrganization, setCurrentOrganization] = useState<any | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<any | null>(null);
  const [viewAsRole, setViewAsRole] = useState<string | null>(null);

  // Initialize viewAsRole from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('viewAsRole');
      if (storedRole) {
        setViewAsRole(storedRole);
      }
    }
  }, []);

  const fetchUser = async (preserveViewAsRole: boolean = false) => {
    try {
      // Preserve current viewAsRole if requested
      const currentViewAsRole = preserveViewAsRole ? viewAsRole : null;
      
      // Use sync-based auth endpoints (goes through [...path]/route.ts)
      const response = await fetch('/api/auth/current-user', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.ok) {
        const userData: AuthUser = await response.json();
        setUser(userData);
        setOrganizations(userData.availableOrganizations);
        if (userData.currentContext.organizationId) {
          setCurrentOrganization(userData.availableOrganizations.find((c: { id: string }) => c.id === userData.currentContext.organizationId) || null);
        }

        // Fetch user's campaigns
        const campsResponse = await fetch('/api/auth/campaigns', {
          credentials: 'include',
          cache: 'no-store'
        });
        if (campsResponse.ok) {
          const campsData = await campsResponse.json();
          setCampaigns(campsData.campaigns || []);
          if ((userData as any).currentContext?.campaignId) {
            const curCamp = campsData.campaigns?.find((c: any) => c.id === (userData as any).currentContext.campaignId);
            setCurrentCampaign(curCamp || null);
          }
        }
        
        // Restore viewAsRole if it was preserved
        if (preserveViewAsRole && currentViewAsRole) {
          setViewAsRole(currentViewAsRole);
        }
      } else {
        setUser(null);
        setOrganizations([]);
        setCurrentOrganization(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setOrganizations([]);
      setCurrentOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch to ensure we hydrate with the latest server-side currentContext and lists
    // Use initialUser only as a quick placeholder while the real data loads
    if (initialUser) setUser(initialUser);
    fetchUser();
  }, [initialUser]);

  const switchOrganization = async (orgId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({ contextId: orgId })
      });

      if (response.ok) {
        // Find the organization in our list
        const org = organizations.find(o => o.id === orgId);
        setCurrentOrganization(org || null);
        
        // Update user object with new context
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            currentContext: {
              ...prevUser.currentContext,
              organizationId: orgId
            }
          };
        });
        
        // Refresh to get updated permissions (preserve current viewAsRole)
        await fetchUser(true);
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const switchCampaign = async (campaignId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/auth/switch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campaignId })
      });
      if (response.ok) {
        const camp = campaigns.find(c => c.id === campaignId);
        setCurrentCampaign(camp || null);
        setUser(prev => prev ? { ...prev, currentContext: { ...prev.currentContext, campaignId } } : prev);
        await fetchUser(true);
      }
    } catch (error) {
      console.error('Failed to switch campaign:', error);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || !user.effectiveRole) return false;
    
    const permissions = user.effectiveRole.permissions;
    return permissions?.[resource]?.[action] === true;
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.effectiveRole) return false;
    // If viewing as a different role, use that role for checks
    const effectiveRoleName = viewAsRole || user.effectiveRole.name;
    return effectiveRoleName === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.effectiveRole) return false;
    // If viewing as a different role, use that role for checks
    const effectiveRoleName = viewAsRole || user.effectiveRole.name;
    return roles.includes(effectiveRoleName);
  };

  const logout = async () => {
    try {
      // Use sync-based logout endpoint
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' // Include cookies for session
      });
      // Also logout from better-auth
      await fetch('/api/auth/sign-out', { 
        method: 'POST',
        credentials: 'include' // Include cookies for session
      });
      setUser(null);
      setOrganizations([]);
      setCurrentOrganization(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refresh = (preserveViewAsRole: boolean = false) => {
    fetchUser(preserveViewAsRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        organizations,
        campaigns,
        currentOrganization,
        currentCampaign,
        viewAsRole,
        switchOrganization,
        switchCampaign,
        setViewAsRole: (role: string | null) => {
          setViewAsRole(role);
          if (typeof window !== 'undefined') {
            if (role) {
              localStorage.setItem('viewAsRole', role);
            } else {
              localStorage.removeItem('viewAsRole');
            }
          }
        },
        hasPermission,
        hasRole,
        hasAnyRole,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Enhanced helper hooks
export function useIsAdmin() {
  const { hasAnyRole } = useAuth();
  return hasAnyRole([ROLES.PLATFORM_ADMIN, ROLES.MANAGER]);
}

export function useIsPlatformAdmin() {
  const { hasRole } = useAuth();
  return hasRole(ROLES.PLATFORM_ADMIN);
}

export function useIsOrgAdmin() {
  const { hasRole } = useAuth();
  return hasRole(ROLES.MANAGER);
}

export function useCurrentOrganization() {
  const { currentOrganization } = useAuth();
  return currentOrganization;
}

export function useHasPermission(resource: string, action: string) {
  const { hasPermission } = useAuth();
  return hasPermission(resource, action);
}

export function useHasRole(role: string) {
  const { hasRole } = useAuth();
  return hasRole(role);
}

export function useHasAnyRole(roles: string[]) {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles);
}

// Specific permission hooks for common use cases
export function useCanCreateOrganizations() {
  const { hasPermission } = useAuth();
  return hasPermission('organizations', 'create');
}

export function useCanCreateCampaigns() {
  const { hasPermission } = useAuth();
  return hasPermission('campaigns', 'create');
}

export function useCanCreateProjects() {
  const { hasPermission } = useAuth();
  return hasPermission('projects', 'create');
}

export function useCanManageMembers() {
  const { hasPermission } = useAuth();
  return hasPermission('organizations', 'manage_members') || 
         hasPermission('teams', 'manage_members');
}

export function useOrganizationSwitcher() {
  const { organizations, currentOrganization, switchOrganization } = useAuth();
  return { organizations, currentOrganization, switchOrganization };
}
