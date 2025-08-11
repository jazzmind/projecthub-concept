# RBAC System Design with Independent Concepts

## Overview

This document demonstrates how our independent concept design achieves Role-Based Access Control (RBAC) through synchronizations rather than direct dependencies.

## Core RBAC Concepts

### 1. User
- Manages basic authentication and profile
- NO organization references
- NO role references beyond platform admin/user

### 2. Role  
- Defines permissions for resources and actions
- Scoped to "platform" or "organization"
- Contains granular permission matrix

### 3. Membership
- Connects Users to Organizations through Roles
- Handles invitation/approval workflow
- Tracks membership lifecycle

### 4. Session
- Manages user context (current organization)
- Provides workspace state
- Handles multi-device sessions

## Example RBAC Workflows via Synchronizations

### User Authentication & Authorization

```typescript
// Sync: When user logs in, establish session with permissions
const HandleUserLogin = ({ userId, sessionId, organizationId }: Vars) => ({
  when: actions([
    User.updateLastLogin, { id: userId }, {}
  ]),
  where: (frames: Frames) => {
    // Get user's active memberships
    const memberships = Membership._getActiveByUser({ userId });
    const defaultOrg = organizationId || memberships[0]?.organizationId;
    
    return frames.map(frame => ({
      ...frame,
      [sessionId]: {
        userId,
        currentOrganizationId: defaultOrg,
        permissions: calculateUserPermissions(memberships, defaultOrg)
      }
    }));
  },
  then: actions([
    Session.create, { userId, currentOrganizationId: sessionId.currentOrganizationId }, {}
  ])
});

// Helper function to calculate permissions
function calculateUserPermissions(memberships, currentOrgId) {
  const membership = memberships.find(m => m.organizationId === currentOrgId);
  if (!membership) return {};
  
  const role = Role._getById({ id: membership.roleId })[0];
  return role?.permissions || {};
}
```

### Organization Role Management

```typescript
// Sync: Add user to organization with role
const HandleAddUserToOrganization = ({ userId, organizationId, roleId, invitedBy }: Vars) => ({
  when: actions([
    API.request, { 
      method: "POST", 
      path: "/api/organizations/:orgId/members",
      orgId: organizationId,
      userId,
      roleId,
      invitedBy
    }, {}
  ]),
  where: (frames: Frames) => {
    // Verify inviter has permission
    const inviterMembership = Membership._getByUserAndOrganization({ 
      userId: invitedBy, 
      organizationId 
    })[0];
    
    const inviterRole = Role._getById({ id: inviterMembership?.roleId })[0];
    const canInvite = inviterRole?.permissions?.users?.create === true;
    
    if (!canInvite) {
      throw new Error("Insufficient permissions to invite users");
    }
    
    return frames;
  },
  then: actions([
    Membership.invite, { userId, organizationId, roleId, invitedBy }, {}
  ])
});
```

### Permission-Based Resource Access

```typescript
// Sync: Check permissions before allowing campaign creation
const HandleCampaignCreation = ({ userId, campaignData, sessionId }: Vars) => ({
  when: actions([
    API.request, { 
      method: "POST", 
      path: "/api/campaigns",
      ...campaignData
    }, {}
  ]),
  where: (frames: Frames) => {
    // Get current session and organization
    const session = Session._getById({ id: sessionId })[0];
    const currentOrgId = session?.currentOrganizationId;
    
    // Get user's membership in current organization
    const membership = Membership._getByUserAndOrganization({ 
      userId, 
      organizationId: currentOrgId 
    })[0];
    
    // Get role permissions
    const role = Role._getById({ id: membership?.roleId })[0];
    const canCreateCampaigns = role?.permissions?.campaigns?.create === true;
    
    if (!canCreateCampaigns) {
      throw new Error("Insufficient permissions to create campaigns");
    }
    
    return frames.map(frame => ({
      ...frame,
      [campaignData]: {
        ...frame[campaignData],
        createdByUserId: userId,
        organizationId: currentOrgId
      }
    }));
  },
  then: actions([
    Campaign.create, campaignData, {}
  ])
});
```

### Project Assignment with Role Validation

```typescript
// Sync: Assign project to student (requires educator role)
const HandleProjectAssignment = ({ educatorId, studentId, projectId, campaignId }: Vars) => ({
  when: actions([
    API.request, { 
      method: "POST", 
      path: "/api/assignments",
      studentId,
      projectId,
      campaignId,
      assignedBy: educatorId
    }, {}
  ]),
  where: (frames: Frames) => {
    // Verify educator has assignment permissions
    const session = Session._getActive({ userId: educatorId })[0];
    const membership = Membership._getByUserAndOrganization({ 
      userId: educatorId, 
      organizationId: session?.currentOrganizationId 
    })[0];
    
    const role = Role._getById({ id: membership?.roleId })[0];
    const canAssign = role?.permissions?.assignments?.create === true;
    
    if (!canAssign) {
      throw new Error("Only educators can assign projects");
    }
    
    return frames;
  },
  then: actions([
    Assignment.createDirectAssignment, {
      assignmentType: "project_to_user",
      sourceEntityId: projectId,
      targetEntityId: studentId,
      assignedByUserId: educatorId
    }, {}
  ])
});
```

## Benefits of This Design

### 1. True Independence
- Each concept manages its own state
- No circular dependencies
- Concepts can be developed/tested in isolation

### 2. Flexible RBAC
- Granular permissions per resource/action
- Easy to add new roles and permissions
- Platform and organization scoped roles

### 3. Maintainable Synchronizations
- Clear separation of concerns
- Permission checks in sync layer
- Easy to modify business rules

### 4. Audit Trail
- All role changes tracked in Membership
- Session context preserved
- Assignment history maintained

## Built-in Roles Example

```typescript
// Platform Admin Role
{
  name: "platform_admin",
  displayName: "Platform Administrator", 
  scope: "platform",
  permissions: {
    users: { create: true, read: true, update: true, delete: true },
    organizations: { create: true, read: true, update: true, delete: true },
    roles: { create: true, read: true, update: true, delete: true },
    // ... all permissions
  },
  isBuiltIn: true
}

// Education Partner Admin
{
  name: "edu_admin",
  displayName: "Education Administrator",
  scope: "organization", 
  permissions: {
    campaigns: { create: true, read: true, update: true, delete: true },
    assignments: { create: true, read: true, update: true, delete: true },
    teams: { create: true, read: true, update: true, delete: true },
    users: { create: false, read: true, update: false, delete: false },
  },
  isBuiltIn: true
}

// Student/Learner Role
{
  name: "learner",
  displayName: "Learner",
  scope: "organization",
  permissions: {
    campaigns: { create: false, read: true, update: false, delete: false },
    assignments: { create: true, read: true, update: true, delete: false }, // can apply
    teams: { create: false, read: true, update: false, delete: false },
    projects: { create: false, read: true, update: false, delete: false },
  },
  isBuiltIn: true
}
```

This design achieves comprehensive RBAC while maintaining the core principle of concept independence.
