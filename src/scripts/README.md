# ProjectHub Scripts

## Overview

This directory contains various utility scripts for setting up, seeding, and importing data into the ProjectHub system.

## Scripts Available

### 1. Install Script (`install.ts`)

Bootstrap the system with core roles, default organization, and admin users.

#### Usage
```bash
cd src
npx tsx scripts/install.ts
```

#### Environment Variables Required
- `AUTO_REGISTER_DOMAIN`: Domain for the default organization (e.g., "practera.com")
- `ADMIN_USERS`: Comma-separated list of admin user emails

#### What it does
- Creates core roles (platform_admin, manager, educator, provider, learner)
- Creates default organization for the specified domain
- Creates a starter campaign
- Registers admin users and assigns them to the organization with appropriate roles

### 2. Seed Script (`seed.ts`)

Seeds the database with sample campaign data.

#### Usage
```bash
cd src
npx tsx scripts/seed.ts
```

#### What it does
- Creates sample campaigns (Fall Bootcamp, Spring Studio)
- Sets up test data for development and testing

### 3. Import Projects Script (`import-projects.ts`)

Imports project briefs from JSON files into the ProjectHub database.

#### Usage

**Option 1: Default Path**
```bash
npm run import:projects
```
Make sure `enhanced_project_briefs_v2.json` is available in the `project-brief-generator` directory.

**Option 2: Custom File Path**
```bash
npm run import:projects -- --file /path/to/your/project-briefs.json
```

**Direct TypeScript execution:**
```bash
npx tsx scripts/import-projects.ts --file /path/to/your/project-briefs.json
```

#### Examples
```bash
# Import from default location
npm run import:projects

# Import from specific file
npm run import:projects -- --file ../data/my-projects.json

# Import with absolute path
npm run import:projects -- --file /Users/username/Downloads/enhanced_project_briefs_v2.json

# Show help
npx tsx scripts/import-projects.ts --help
```

### Features

- **Smart Data Mapping:** Automatically maps industry categories to domains
- **Skill Extraction:** Combines technical and professional skills
- **Difficulty Assessment:** Determines project difficulty based on duration and complexity
- **Duplicate Detection:** Skips projects that have already been imported
- **Error Handling:** Continues importing even if individual projects fail
- **Progress Reporting:** Shows detailed progress and summary

### Data Transformation

The script transforms project brief data as follows:

- **Industry:** Cleans up industry names and removes phone numbers
- **Domain:** Maps industry categories to specific domains (e.g., Healthcare, Technology)
- **Difficulty:** Calculated based on duration and skill requirements
- **Estimated Hours:** Calculated as duration_weeks × 12 hours/week
- **Skills:** Combines technical and professional skills, removes duplicates
- **Tags:** Generated from industry, project type, and top skills
- **Learning Objectives:** Extracted from focus area

### Project Status

All imported projects are set to "active" status by default. You can modify individual project statuses through the manager interface.

### After Import

1. Visit `http://localhost:3000/manager/projects` to view imported projects
2. Review and edit project details as needed
3. Adjust project statuses (active/draft/archived) as appropriate
4. Verify that all required fields are properly populated

### Troubleshooting

- **File not found:** Ensure the JSON file path is correct
- **Database connection errors:** Check that the database is running and accessible
- **Permission errors:** Ensure the script has read access to the JSON file
- **Memory issues:** For very large datasets, consider batch processing

### Script Outputs

- ✅ Successfully imported projects
- ⏭️ Skipped projects (already exist)
- ❌ Projects with errors
- 📊 Final summary with counts and next steps

## Recommended Setup Workflow

For a fresh ProjectHub installation, run scripts in this order:

### 1. Set up environment variables
Create a `.env.local` file in the src directory:
```bash
# Required for install script
AUTO_REGISTER_DOMAIN=practera.com
ADMIN_USERS=admin@practera.com,manager@practera.com

# Other required variables
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Bootstrap the system
```bash
npm run install:system
```

### 3. Seed sample data (optional)
```bash
npm run seed
```

### 4. Import projects (optional)
```bash
npm run import:projects
```

## Available NPM Scripts

- `npm run install:system` - Bootstrap system with roles and admin users
- `npm run seed` - Add sample campaign data
- `npm run import:projects` - Import project briefs from JSON file

## Environment Variables

All scripts require proper environment variables to be set in `.env.local`:

- **AUTO_REGISTER_DOMAIN**: Domain for default organization (required for install)
- **ADMIN_USERS**: Comma-separated admin emails (required for install)
- **DATABASE_URL**: PostgreSQL connection string (required for all)

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure DATABASE_URL is correct and database is running
2. **Permission errors**: Ensure scripts have read/write access to files and database
3. **Missing environment variables**: Check that all required variables are set in `.env.local`
4. **TypeScript errors**: Run `npm run build` to check for compilation issues

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all environment variables are properly set
3. Ensure the database schema is up to date: `npm run db:push`
4. Check that all dependencies are installed: `npm install`
