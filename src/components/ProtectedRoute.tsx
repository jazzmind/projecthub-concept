'use client';

import { ReactNode } from 'react';
import { useAuth, useHasPermission, useHasAnyRole } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requiredRoles?: string[];
  fallback?: ReactNode;
  unauthorized?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = <div className="p-4 text-center">Loading...</div>,
  unauthorized = <div className="p-4 text-center text-red-600">Access Denied</div>
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <>{unauthorized}</>;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user?.effectiveRole?.name || '');
    if (!hasRequiredRole) {
      return <>{unauthorized}</>;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    for (const permission of requiredPermissions) {
      const hasPermission = user?.effectiveRole?.permissions?.[permission.resource]?.[permission.action];
      if (!hasPermission) {
        return <>{unauthorized}</>;
      }
    }
  }

  return <>{children}</>;
}

// Specific component variations for common use cases
export function AdminOnlyRoute({ 
  children, 
  fallback,
  unauthorized 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  unauthorized?: ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRoles={['platform_admin', 'org_admin']}
      fallback={fallback}
      unauthorized={unauthorized}
    >
      {children}
    </ProtectedRoute>
  );
}

export function PlatformAdminOnlyRoute({ 
  children, 
  fallback,
  unauthorized 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  unauthorized?: ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRoles={['platform_admin']}
      fallback={fallback}
      unauthorized={unauthorized}
    >
      {children}
    </ProtectedRoute>
  );
}

export function EducatorOnlyRoute({ 
  children, 
  fallback,
  unauthorized 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  unauthorized?: ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredRoles={['platform_admin', 'org_admin', 'educator']}
      fallback={fallback}
      unauthorized={unauthorized}
    >
      {children}
    </ProtectedRoute>
  );
}

// Permission-based component wrapper
interface ConditionalRenderProps {
  children: ReactNode;
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export function ConditionalRender({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null
}: ConditionalRenderProps) {
  const { user } = useAuth();

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user?.effectiveRole?.name || '');
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    for (const permission of requiredPermissions) {
      const hasPermission = user?.effectiveRole?.permissions?.[permission.resource]?.[permission.action];
      if (!hasPermission) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
