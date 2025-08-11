'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth';

// Extended user type for client-side state
type ExtendedUser = SessionUser & {
  currentOrganizationId?: string;
  organizationMemberships?: any[];
  platformRole?: string;
};

interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  currentOrganization: any | null;
  setCurrentOrganization: (org: any) => void;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOrganization, setCurrentOrganizationState] = useState<any | null>(null);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Set current organization if user has one
        if (userData?.currentOrganizationId) {
          // Fetch organization details
          const orgResponse = await fetch(`/api/organizations/${userData.currentOrganizationId}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            setCurrentOrganizationState(orgData);
          }
        }
      } else {
        setUser(null);
        setCurrentOrganizationState(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setCurrentOrganizationState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const setCurrentOrganization = async (org: any) => {
    if (!user) return;

    try {
      // Update user's current organization
      const response = await fetch('/api/user/current-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: org.id })
      });

      if (response.ok) {
        setCurrentOrganizationState(org);
        // Update user object
        setUser((prevUser: ExtendedUser | null) => prevUser ? { ...prevUser, currentOrganizationId: org.id } : null);
      }
    } catch (error) {
      console.error('Failed to set current organization:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setCurrentOrganizationState(null);
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
        currentOrganization,
        setCurrentOrganization,
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

// Helper hooks for specific roles
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.isAdmin || false;
}

export function useCurrentOrganization() {
  const { currentOrganization } = useAuth();
  return currentOrganization;
}

export function useHasRole(role: string) {
  const { user, currentOrganization } = useAuth();
  
  if (!user || !currentOrganization) return false;
  
  const memberships = (user.organizationMemberships as any[]) || [];
  const membership = memberships.find(
    (m: any) => m.organizationId === currentOrganization.id && m.isActive
  );
  
  return membership?.role === role;
}
