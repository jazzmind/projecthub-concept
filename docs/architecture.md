---
title: ProjectHub Architecture
lastUpdated: 2025-08-10
---

## Purpose and Scope
ProjectHub is a platform for sourcing and managing industry projects and partner companies using a concept design approach.

### Core Features
- **Industry Partner Campaigns**: Landing pages with email/social campaigns where industry partners provide domain and focus areas. AI-powered project recommendations with interactive scope customization using chat interface.
- **Education Partner Management**: Campaign setup with learning objectives, project constraints, and customized landing pages.
- **Project Assignment/Matching**: Direct project assignment to students/teams, project browsing, and student application tracking.
- **Team Management**: Support for various team types (student-only, with experts, with industry partners, full collaboration).
- **Role-Based Access Control**: Multi-organization user management with role-based permissions (Admin, Educator, Expert, Industry Partner, Learner).

### Dashboard Views
- Campaign management and analytics
- Industry partner and expert databases
- Project template library
- Team coordination and progress tracking
- Organization management and user administration

## Architecture Overview

### Concept Design Framework
The application is built using **Concept Design** - a modular approach where functionality is organized into independent concepts connected by synchronizations.

#### Core Concepts Implemented
- **User**: Platform user management with role-based access across organizations
- **Organization**: Hierarchical organization structure with managing relationships
- **Campaign**: Project sourcing campaigns with constraints and landing pages
- **Project**: Industry projects with AI generation and customization capabilities
- **Team**: Student collaboration with optional expert and industry partner involvement
- **Assignment**: Project assignments and application tracking
- **Expert**: Domain expertise management and project feedback

### Utility Concepts
- **API**: HTTP request/response handling for external access
- **Membership**: Lets objects like users belong to other objects like teams and orgs.
- **Assignment**: Lets objects like projects be assigned to other objects like teams and users.
- **Role**: Lets objects like users have roles like admin, educator, expert, industry partner, and learner and associated permissions
- **Notification**: Lets objects like users receive notifications for important events.
- **File**: Lets objects like projects have files and attachments.
- **Comment**: Lets objects like projects have comments and discussion threads.
- **Setting**: Lets objects like organizations have settings and preferences.
- **Tag**: Lets objects like projects have tags and categories.
- **Session**: Lets objects like users have sessions and activity logs.

### Core Roles
- **Admin**: Full access to all features and settings
- **Educator**: Manage campaigns, teams, and assignments
- **Expert**: Provide project feedback and guidance
- **Industry Partner**: Source projects and collaborate with teams
- **Learner**: Participate in projects and learn from experts

### Synchronizations

Synchronizations are the connections between concepts. They are defined in the `specs/` directory and are used to generate the `lib/syncs/` directory.

- **User, [Organization|Campaign|Project|Team|User], Assignment, Role**: A User is Assigned Roles to Organizations, Campaigns, Projects and Teams. This is how access is controlled. The narrowest role is used for an object. E.g. an org admin in a team as a student, the student role is used for team resources, but the admin role is used for organization resources. Organization is broadest, then Campaign, then Project, then Team, then User (a user has owner role for themselves). . 
- **[Campaign,Organization|Project,Campaign|User,Team] Membership**: A campaign has Memberships to an organization. A project has Memberships to one or more campaigns. A user has Memberships to one or more teams.
- **Project, [User,Team], Assignment**: A project can be assigned to a user or team. A project can have one or more assignments.


## AI Agents (Planned)
- **Project Agent**: AI system for generating and refining project scope using RAG search and chat interface
- **Sourcing Agent**: AI system for researching and identifying potential industry partners with outreach strategies

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 App Router with server actions and API routes
- **Styling**: Tailwind CSS v4 with custom component system
- **Authentication**: better-auth with email OTP verification
- **UI Components**: Role-based navigation with organization context switching

### Backend Architecture
- **Concept Engine**: TypeScript-based concept design framework with synchronization patterns
- **Database**: PostgreSQL with Prisma ORM and automatic schema generation
- **Authentication**: better-auth integration with PostgreSQL session storage
- **API Layer**: RESTful endpoints generated from concept synchronizations

### Database Design
- **Schema Generation**: Automated Prisma schema creation from `.concept` specifications
- **Persistence**: PostgreSQL with Prisma client for type-safe database operations
- **Migrations**: Schema synchronization with `npm run schema:sync`

### Development Tools
- **Validation**: AI-powered concept validation with alignment analysis (`npm run validate:ai`)
- **Schema Sync**: Automatic Prisma schema generation from concept files (`npm run schema:sync`)
- **Type Safety**: Strict TypeScript with Prisma client generation

### File Structure
```
src/
├── specs/              # Concept specifications (.concept files)
├── lib/concepts/       # TypeScript concept implementations
├── lib/syncs/          # Concept synchronization definitions
├── lib/engine/         # Core concept design framework
├── app/                # Next.js application routes and pages
├── components/         # React UI components
└── prisma/             # Database schema and migrations
```

### Environment Configuration
- **Database**: PostgreSQL via `DATABASE_URL`
- **Email**: SMTP configuration for authentication emails
- **Admin Users**: Comma-separated admin emails in `ADMIN_USERS`
- **AI Integration**: OpenAI API key for validation and future AI agents

### Authentication Flow
1. Email-based login with OTP verification
2. Role-based access control across multiple organizations
3. Current organization context for scoped operations
4. Admin-level platform access with elevated permissions

### Deployment
- **Environment**: Configured via `.env.local`
- **Database**: Neon PostgreSQL for production
- **AI Services**: llamaindex integration for vector operations (planned)
- **Integrations**: HubSpot Search API, Nodemailer SMTP support
