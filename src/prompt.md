## Initial prompt

Carefully reason through, plan, and build the following: Build a platform for sourcing and managing industry projects and partner companies. Build everything in this dir: @projecthub.

- Write `.concept` specifications under ../specs
- Write `.ts` concept implementations under ../concepts
- Write `.ts` synchronizations under ../syncs
- You may use any other structure to setup the full stack application and hook
  into the concept design system.

The specific requirements, including images of the design, are as follows:


### Purpose and scope
- Build a marketplace for curated industry projects and partner companies.
- Surfaces:
  - Industry Partner Campaigns: These are landing pages and associated email/social media campaigns. When they get to a landing page, the industry partner can put in their domain name and focus area. We'll then use AI search of our project database to suggest several potential projects for that company. The company can then select a project and interactively customize the scope of the project. The AI system will ensure that the scope is aligned with the learning objectives for the campaign. It will use a chat interface to collaboratively refine the scope of the project.
  - Education Partner: Can set up campaigns which are associated with Practera Experiences (specific learning objectives, etc.). These campaigns constrain the types of projects, domains, industry parameters and other project attributes. They create a customized campaign landing page (see Industry Partner Campaign Page above).
  - Project Assignment/Matching: The education partner can assign projects to students. They can also browse the project database and select/generate projects to use off-system. There is also a UI where students can browse available industry projects and apply for them. Applications are tracked and can be viewed by the education partner. 
  
  There is also a modern dashboard views for Campaigns, Industry, Experts, and Templates used to visualize/manage sourcing. They can also browse the project database and select/generate projects to use off-system.

  There is an industry partner/expert database which tracks the companies and experts that we've sourced. This database is associated with the organization managing the campaign. 


## Entity Types

Organization - an organization has a managing organization, which can be itself for a top-level organization or a parent organization to help model schools/faculties within a university etc.

Industry Partner - an industry partner is a person at an organization that is interested in sourcing projects for their company. They can be associated with an organization.

Expert - an expert is a person who has expertise in a particular domain. They can be associated with an organization. They often provide feedback on projects and can be associated with a project.

Project - a project is a specific project that is being sourced for a campaign. It has a title, description, scope, and other attributes. It can be associated with an industry partner, an expert, and a campaign.

## AI Agents
- Project Agent - a project agent is a system that can generate projects. It uses a RAG to search the project database and can use a chat interface to collaboratively refine the scope of the project with a potential industry partner.
- Sourcing Agent - a sourcing agent is a system that researches potential industry partners for a campaign. It comes up with a list of companies that are a good fit for the campaign and techniques to contact them (e.g. social media outreach, email, etc.).

### High-level architecture
- Frontend surface: Next.js 15 App Router (server actions + API routes). Some UI pages in `project-brief-generator/app/**` and the P3 `source` dashboard in `p3-prototype/ui/src/app/(modes)/source/**`.
- Database: Prisma Postgres for domain persistence (companies, projects, campaigns, leaderboard). 
- Auth: better-auth + Prisma on PostgreSQL (users/sessions) with Google OAuth. A separate JWT middleware is present but inconsistent.
- AI: use llamaindex as both an AI abstraction layer and a vector database.
- Integrations: HubSpot Search API, SMTP via Nodemailer.
- Deployment: SST scaffolding present; environment via `.env`.
