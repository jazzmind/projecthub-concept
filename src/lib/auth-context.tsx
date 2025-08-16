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
  availableContexts: Array<{
    type: 'organization' | 'campaign' | 'project' | 'team';
    id: string;
    name: string;
    role: string;
  }>;
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
  ORG_ADMIN: 'org_admin',
  EDUCATOR: 'educator',
  EXPERT: 'expert',
  INDUSTRY_PARTNER: 'industry_partner',
  TEAM_LEADER: 'team_leader',
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
  currentOrganization: any | null;
  viewAsRole: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
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
  const [currentOrganization, setCurrentOrganization] = useState<any | null>(null);
  const [viewAsRole, setViewAsRole] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      // Use sync-based auth endpoints (goes through [...path]/route.ts)
      const response = await fetch('/api/auth/current-user');
      if (response.ok) {
        const userData: AuthUser = await response.json();
        setUser(userData);
        
        // Fetch user's organizations via sync endpoint
        const orgsResponse = await fetch('/api/auth/organizations');
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          setOrganizations(orgsData.organizations || []);
          
          // Set current organization based on user's current context
          if (userData.currentContext.organizationId) {
            const currentOrg = orgsData.organizations?.find(
              (org: any) => org.id === userData.currentContext.organizationId
            );
            setCurrentOrganization(currentOrg || null);
          }
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
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
    } else {
      fetchUser();
    }
  }, []);

  const switchOrganization = async (orgId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        
        // Refresh to get updated permissions
        await fetchUser();
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
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
      await fetch('/api/auth/logout', { method: 'POST' });
      // Also logout from better-auth
      await fetch('/api/auth/sign-out', { method: 'POST' });
      setUser(null);
      setOrganizations([]);
      setCurrentOrganization(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refresh = () => {
    fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        organizations,
        currentOrganization,
        viewAsRole,
        switchOrganization,
        setViewAsRole,
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
  return hasAnyRole([ROLES.PLATFORM_ADMIN, ROLES.ORG_ADMIN]);
}

export function useIsPlatformAdmin() {
  const { hasRole } = useAuth();
  return hasRole(ROLES.PLATFORM_ADMIN);
}

export function useIsOrgAdmin() {
  const { hasRole } = useAuth();
  return hasRole(ROLES.ORG_ADMIN);
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
