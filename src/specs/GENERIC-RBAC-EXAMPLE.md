# Generic RBAC System with Independent Concepts

## Overview

This demonstrates how truly generic, independent concepts achieve RBAC through synchronizations, following the patterns shown in the reference documentation.

## Core Generic Concepts

### 1. User
- Manages basic user identification with String identifiers
- NO references to organizations, roles, or sessions
- Pure: `register(user: "u1", email: "test@example.com", name: "John")`

### 2. Role  
- Defines named permission sets with flexible structure
- Generic scope field for any permission domain
- Pure: `create(name: "admin", scope: "platform", permissions: {...})`

### 3. Membership
- Connects any two entities through roles
- Generic String identifiers: `memberEntity`, `targetEntity`, `roleEntity`
- Pure: `invite(member: "u1", target: "org1", role: "admin", invitedBy: "system")`

### 4. Session
- Manages session context with generic identifiers
- Generic `currentContext` field (no specific organization reference)
- Pure: `create(sessionKey: "sess123", loginMethod: "email")`

### 5. Organization
- Generic organizational entities with hierarchical structure
- String identifiers and flexible type classification
- Pure: `create(organization: "org1", name: "Example Corp", type: "company")`

## Example RBAC Workflows via Synchronizations

### User Authentication with Generic Context

```typescript
// Sync: When user logs in, establish session with context
const HandleUserLogin = ({ userIdentifier, sessionKey, organizationId }: Vars) => ({
  when: actions([
    User.updateLastLogin, { user: userIdentifier }, {}
  ]),
  where: (frames: Frames) => {
    // Get user's active memberships (any entity can be a member of any other)
    const memberships = Membership._getActiveByMember({ memberEntity: userIdentifier });
    const defaultContext = organizationId || memberships[0]?.targetEntity;
    
    return frames.map(frame => ({
      ...frame,
      [sessionKey]: {
        sessionKey: `session_${userIdentifier}_${Date.now()}`,
        currentContext: defaultContext,
        loginMethod: "email"
      }
    }));
  },
  then: actions([
    Session.create, { 
      sessionKey: sessionKey.sessionKey,
      loginMethod: sessionKey.loginMethod
    }, {}
  ])
});
```

### Generic Organization Role Management

```typescript
// Sync: Add any entity to any organization with any role
const HandleAddMemberToOrganization = ({ 
  memberEntity, 
  targetEntity, 
  roleEntity, 
  inviterEntity 
}: Vars) => ({
  when: actions([
    API.request, { 
      method: "POST", 
      path: "/api/memberships",
      memberEntity,
      targetEntity,
      roleEntity,
      inviterEntity
    }, {}
  ]),
  where: (frames: Frames) => {
    // Verify inviter has permission (generic check)
    const inviterMembership = Membership._getByMemberAndTarget({ 
      memberEntity: inviterEntity, 
      targetEntity 
    })[0];
    
    const inviterRole = Role._getById({ id: inviterMembership?.roleEntity })[0];
    const canInvite = inviterRole?.permissions?.memberships?.create === true;
    
    if (!canInvite) {
      throw new Error("Insufficient permissions to invite members");
    }
    
    return frames;
  },
  then: actions([
    Membership.invite, { 
      memberEntity, 
      targetEntity, 
      roleEntity, 
      invitedBy: inviterEntity 
    }, {}
  ])
});
```

### Generic Permission-Based Resource Access

```typescript
// Sync: Check permissions before allowing resource creation
const HandleResourceCreation = ({ 
  userEntity, 
  resourceData, 
  sessionKey,
  resourceType 
}: Vars) => ({
  when: actions([
    API.request, { 
      method: "POST", 
      path: `/api/${resourceType}`,
      ...resourceData
    }, {}
  ]),
  where: (frames: Frames) => {
    // Get current session context (generic)
    const session = Session._getBySessionKey({ sessionKey })[0];
    const currentContext = session?.currentContext;
    
    // Get user's membership in current context (generic entities)
    const membership = Membership._getByMemberAndTarget({ 
      memberEntity: userEntity, 
      targetEntity: currentContext 
    })[0];
    
    // Get role permissions (generic permission structure)
    const role = Role._getById({ id: membership?.roleEntity })[0];
    const canCreate = role?.permissions?.[resourceType]?.create === true;
    
    if (!canCreate) {
      throw new Error(`Insufficient permissions to create ${resourceType}`);
    }
    
    return frames.map(frame => ({
      ...frame,
      [resourceData]: {
        ...frame[resourceData],
        createdBy: userEntity,
        context: currentContext
      }
    }));
  },
  then: actions([
    // Would sync to appropriate concept based on resourceType
    // This shows the generic pattern - specific resource concepts remain independent
  ])
});
```

### Generic Assignment with Role Validation

```typescript
// Sync: Create assignment between any entities with role validation
const HandleGenericAssignment = ({ 
  assignerEntity, 
  sourceEntity, 
  targetEntity, 
  assignmentType 
}: Vars) => ({
  when: actions([
    API.request, { 
      method: "POST", 
      path: "/api/assignments",
      sourceEntity,
      targetEntity,
      assignmentType,
      assignedBy: assignerEntity
    }, {}
  ]),
  where: (frames: Frames) => {
    // Get assigner's session context
    const session = Session._getActive({ sessionKey: assignerEntity })[0];
    
    // Check if assigner has assignment permissions in current context
    const membership = Membership._getByMemberAndTarget({ 
      memberEntity: assignerEntity, 
      targetEntity: session?.currentContext 
    })[0];
    
    const role = Role._getById({ id: membership?.roleEntity })[0];
    const canAssign = role?.permissions?.assignments?.create === true;
    
    if (!canAssign) {
      throw new Error("Insufficient permissions to create assignments");
    }
    
    return frames;
  },
  then: actions([
    Assignment.createDirectAssignment, {
      assignment: `assign_${Date.now()}`,
      assignmentType,
      sourceEntity,
      targetEntity,
      assignedBy: assignerEntity
    }, {}
  ])
});
```

## Benefits of Generic Design

### 1. True Reusability
- Concepts work in any domain (education, corporate, government)
- No hardcoded assumptions about use case
- Easy to compose for different applications

### 2. Perfect Independence
- No concept references another concept
- Each concept can be developed and tested in isolation
- Clean separation of concerns

### 3. Flexible Through Synchronizations
- Business logic lives in sync layer
- Easy to modify behavior without touching concepts
- Domain-specific rules expressed declaratively

### 4. Scalable Architecture
- New entity types added without changing existing concepts
- Permission systems extend through Role concept
- Relationship patterns handled by Assignment and Membership

## Generic Role Examples

```javascript
// Platform Administrator (works in any system)
{
  name: "system_admin",
  scope: "platform", 
  permissions: {
    users: { create: true, read: true, update: true, delete: true },
    organizations: { create: true, read: true, update: true, delete: true },
    roles: { create: true, read: true, update: true, delete: true },
    memberships: { create: true, read: true, update: true, delete: true }
  }
}

// Context Administrator (works for any organization/group)
{
  name: "context_admin",
  scope: "context",
  permissions: {
    assignments: { create: true, read: true, update: true, delete: true },
    memberships: { create: true, read: true, update: true, delete: false },
    resources: { create: true, read: true, update: true, delete: true }
  }
}

// Basic Member (universal pattern)
{
  name: "member",
  scope: "context",
  permissions: {
    assignments: { create: true, read: true, update: true, delete: false },
    resources: { create: false, read: true, update: false, delete: false }
  }
}
```

This generic design enables the same concepts to power educational platforms, corporate systems, government applications, or any other domain through different synchronizations and role configurations.
