# ProjectHub Synchronizations

This directory contains all synchronization specifications for the ProjectHub platform.

## Core RBAC and Authentication
- `auth.sync` - User authentication, session management, and context switching
- `rbac.sync` - Role-based access control, membership management, and permissions

## Resource Management
- `projects.sync` - Project creation, management, and lifecycle with permission checks
- `teams.sync` - Team formation, membership, and collaboration workflows
- `campaigns.sync` - Campaign management and participant registration
- `organizations.sync` - Organizational hierarchy and membership
- `assignments.sync` - Task and project assignment workflows with progress tracking
- `profiles.sync` - User profile management for experts and industry partners

## Composite Workflows
- `workflows.sync` - Complex multi-concept workflows demonstrating RBAC integration

## Synchronization Design Principles

All synchronizations in this system follow the concept design principles:

### 1. Flow-Based Execution
- Actions triggered by user interactions create flow tokens
- Synchronizations condition on multiple related actions within the same flow
- This ensures causally-related actions are properly grouped

### 2. Permission-First Design
- Every resource operation checks user permissions in current context
- Authentication state is validated before any sensitive operations
- Permission checks happen in `where` clauses before actions execute

### 3. Generic Entity Relationships
- Concepts use String identifiers for maximum reusability
- Membership concept connects any entities through roles
- Role concept defines flexible permission structures for any domain

### 4. Declarative Error Handling
- Error conditions are handled through explicit sync paths
- Authentication failures have dedicated response synchronizations
- Permission violations generate appropriate HTTP error responses

### 5. Context-Aware Operations
- Session concept maintains current organizational context
- Permissions are evaluated within the user's current context
- Context switching is permission-controlled through membership validation

## Permission Patterns

### Standard Resource Permissions
```
{
  "resource_name": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean,
    "publish": boolean,     // for publishable resources
    "archive": boolean,     // for archivable resources
    "manage_members": boolean  // for entities with memberships
  }
}
```

### Common Role Examples
- `platform_admin`: Full platform access across all organizations
- `org_admin`: Full access within organization context
- `team_leader`: Team management and project assignment capabilities
- `team_member`: Basic participation and resource access
- `guest`: Read-only access to public resources

## Workflow Examples

### User Registration Flow
1. User registers with organization domain
2. System validates organization exists and is active
3. User is automatically invited to organization with basic role
4. Membership is auto-accepted for seamless onboarding

### Project Assignment Flow
1. Admin assigns project to team (permission-checked)
2. Team leader accepts assignment on behalf of team
3. Assignment tracking begins with progress notes
4. Completion triggers automatic feedback workflow

### Team Formation Flow
1. User creates team with optional initial project
2. Creator becomes team leader automatically
3. Initial project assignment is created and accepted
4. Team is ready for additional member invitations

These synchronizations demonstrate how independent concepts compose into complex, permission-aware workflows while maintaining clean separation of concerns.











