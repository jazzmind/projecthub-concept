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
- **IndustryPartner**: Company contact management and project sourcing
- **API**: HTTP request/response handling for external access

#### Development Tools
- **Concept Validation Engine**: AI-powered validation of concept specifications vs implementations
- **Schema Synchronization**: Automatic Prisma schema generation from concept specifications
- **Synchronization Framework**: Event-driven concept interactions

### Core Entities

- **User**: Platform users with email-based authentication, organization memberships, and role-based permissions
- **Organization**: Hierarchical structure supporting education institutions and industry companies with managing relationships
- **Campaign**: Project sourcing campaigns with industry/project constraints and customizable landing pages
- **Project**: Industry-focused projects with AI generation, expert assignment, and scope customization
- **Team**: Collaborative units supporting various configurations (students, experts, industry partners)
- **Assignment**: Project-to-student/team assignments with application workflows and progress tracking
- **Expert**: Domain specialists providing project feedback and guidance
- **IndustryPartner**: Company contacts for project sourcing and collaboration

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
