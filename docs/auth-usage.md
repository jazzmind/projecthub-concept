# Authentication and Authorization Usage Guide

This guide shows how to use the comprehensive RBAC (Role-Based Access Control) system implemented in ProjectHub.

## Overview

The auth system provides:
- ✅ Session-based authentication with role and context management
- ✅ Organization switching for users with multiple organization access
- ✅ Route protection based on permissions and roles
- ✅ Conditional UI rendering based on user permissions
- ✅ Hierarchical role inheritance (narrower roles take precedence)

## Basic Usage in Components

### 1. Check Authentication Status

```tsx
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

### 2. Check User Permissions

```tsx
import { useHasPermission } from '@/lib/auth-context';

function CreateButton() {
  const canCreate = useHasPermission('projects', 'create');

  if (!canCreate) return null;

  return <button>Create Project</button>;
}
```

### 3. Check User Roles

```tsx
import { useHasRole, useIsAdmin } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth-rbac';

function AdminPanel() {
  const isAdmin = useIsAdmin();
  const isEducator = useHasRole(ROLES.EDUCATOR);

  return (
    <div>
      {isAdmin && <AdminControls />}
      {isEducator && <EducatorTools />}
    </div>
  );
}
```

### 4. Organization Switching

```tsx
import { useOrganizationSwitcher } from '@/lib/auth-context';

function OrgSwitcher() {
  const { organizations, currentOrganization, switchOrganization } = useOrganizationSwitcher();

  return (
    <select 
      value={currentOrganization?.id || ''} 
      onChange={(e) => switchOrganization(e.target.value)}
    >
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.role})
        </option>
      ))}
    </select>
  );
}
```

## Route Protection

### 1. Using ProtectedRoute Component

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS, ROLES } from '@/lib/auth-rbac';

function AdminPage() {
  return (
    <ProtectedRoute
      requiredRoles={[ROLES.PLATFORM_ADMIN, ROLES.ORG_ADMIN]}
      unauthorized={<div>Admin access required</div>}
    >
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function CreateProjectPage() {
  return (
    <ProtectedRoute
      requiredPermissions={[{ resource: 'projects', action: 'create' }]}
    >
      <ProjectForm />
    </ProtectedRoute>
  );
}
```

### 2. Using Specialized Route Components

```tsx
import { AdminOnlyRoute, EducatorOnlyRoute } from '@/components/ProtectedRoute';

function AdminSettings() {
  return (
    <AdminOnlyRoute>
      <AdminSettingsPanel />
    </AdminOnlyRoute>
  );
}

function CampaignManagement() {
  return (
    <EducatorOnlyRoute>
      <CampaignList />
    </EducatorOnlyRoute>
  );
}
```

### 3. Conditional Rendering

```tsx
import { ConditionalRender } from '@/components/ProtectedRoute';

function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      
      <ConditionalRender
        requiredPermissions={[{ resource: 'projects', action: 'update' }]}
      >
        <button>Edit Project</button>
      </ConditionalRender>
      
      <ConditionalRender
        requiredRoles={[ROLES.PLATFORM_ADMIN, ROLES.ORG_ADMIN]}
      >
        <button>Delete Project</button>
      </ConditionalRender>
    </div>
  );
}
```

## API Route Protection

### 1. Basic Authentication Check

```tsx
// app/api/protected/route.ts
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  
  if (!user) {
    return Response.json({ error }, { status: 401 });
  }
  
  // Handle authenticated request
  return Response.json({ data: 'protected content' });
}
```

### 2. Permission-Based Protection

```tsx
// app/api/projects/route.ts
import { requirePermission } from '@/lib/auth-middleware';

export async function POST(request: Request) {
  const { user, hasPermission, error } = await requirePermission(
    request, 
    'projects', 
    'create'
  );
  
  if (!hasPermission) {
    return Response.json({ error }, { status: 403 });
  }
  
  // Handle project creation
  return Response.json({ success: true });
}
```

### 3. Role-Based Protection

```tsx
// app/api/admin/route.ts
import { requireRole } from '@/lib/auth-middleware';
import { ROLES } from '@/lib/auth-rbac';

export async function GET(request: Request) {
  const { user, hasRole, error } = await requireRole(
    request, 
    [ROLES.PLATFORM_ADMIN, ROLES.ORG_ADMIN]
  );
  
  if (!hasRole) {
    return Response.json({ error }, { status: 403 });
  }
  
  // Handle admin request
  return Response.json({ adminData: 'sensitive info' });
}
```

## Role Hierarchy and Context

The system supports hierarchical roles where narrower contexts take precedence:

1. **Platform Level**: `platform_admin`
2. **Organization Level**: `org_admin`, `educator`
3. **Campaign Level**: `educator`
4. **Project Level**: `expert`, `industry_partner`
5. **Team Level**: `team_leader`, `learner`

### Context Switching

Users can have different roles in different contexts. The system automatically determines the most appropriate role based on the current context (organization, campaign, project, team).

```tsx
// User's roles across contexts:
// - Platform Admin in platform context
// - Organization Admin in "Acme University" 
// - Educator in "Spring 2024 Campaign"
// - Expert in "AI Project"

// When user switches to "Acme University" organization:
// Effective role becomes "Organization Admin"

// When user navigates to "AI Project":
// Effective role becomes "Expert" (narrower context)
```

## Available Permissions

The system uses a resource-action permission model:

### Organizations
- `organizations.create`
- `organizations.read`
- `organizations.update`
- `organizations.delete`
- `organizations.manage_members`

### Campaigns
- `campaigns.create`
- `campaigns.read`
- `campaigns.update`
- `campaigns.delete`
- `campaigns.publish`

### Projects
- `projects.create`
- `projects.read`
- `projects.update`
- `projects.delete`
- `projects.assign`

### Teams
- `teams.create`
- `teams.read`
- `teams.update`
- `teams.delete`
- `teams.manage_members`

### Profiles
- `profiles.create`
- `profiles.read`
- `profiles.update`
- `profiles.delete`
- `profiles.verify`

## Convenience Hooks

The system provides specialized hooks for common use cases:

```tsx
import { 
  useIsAdmin,
  useIsPlatformAdmin,
  useIsOrgAdmin,
  useCanCreateOrganizations,
  useCanCreateCampaigns,
  useCanCreateProjects,
  useCanManageMembers
} from '@/lib/auth-context';

function ToolbarButtons() {
  const canCreateOrgs = useCanCreateOrganizations();
  const canCreateCampaigns = useCanCreateCampaigns();
  const canCreateProjects = useCanCreateProjects();
  const canManageMembers = useCanManageMembers();

  return (
    <div className="toolbar">
      {canCreateOrgs && <button>New Organization</button>}
      {canCreateCampaigns && <button>New Campaign</button>}
      {canCreateProjects && <button>New Project</button>}
      {canManageMembers && <button>Manage Members</button>}
    </div>
  );
}
```

## Best Practices

1. **Always check permissions at both UI and API level**
2. **Use the most specific permission check needed**
3. **Provide clear fallback UI for unauthorized states**
4. **Test role switching and context changes thoroughly**
5. **Use TypeScript for better type safety**

## Troubleshooting

### User can't access expected functionality
1. Check if user is in correct organization context
2. Verify user has required role in current context
3. Check if permissions are correctly configured for the role

### Organization switching not working
1. Verify user has active membership in target organization
2. Check API routes are accessible
3. Ensure session management is working correctly

### Routes are not protected
1. Check middleware configuration
2. Verify route patterns in auth middleware
3. Ensure proper permission/role requirements are set
