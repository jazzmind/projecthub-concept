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

### 4. Batch Document Extraction Script (`batch-extract-documents.ts`)

Processes documents in a directory using AI extraction to create projects. Supports batch processing with progress tracking and confirmation.

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

## Batch Document Extraction Script

Processes documents in a directory using AI extraction to create projects.

#### Usage

**Basic usage:**
```bash
npm run extract:batch ./path/to/documents
```

**With specific organization:**
```bash
npm run extract:batch ./documents -- --org=org123
```

**With extraction quality:**
```bash
npm run extract:batch ./documents -- --quality=high
```

**Direct TypeScript execution:**
```bash
npx tsx scripts/batch-extract-documents.ts ./documents --org=org123 --quality=medium
```

#### Parameters

- `directory` (required): Path to directory containing documents
- `--org=<id>` (optional): Organization ID to associate projects with
- `--quality=<level>` (optional): Extraction quality: low, medium, high (default: medium)
- `--help, -h`: Show help message

#### Supported File Types

- `.doc`, `.docx` - Microsoft Word documents
- `.pdf` - PDF documents  
- `.txt` - Plain text files
- `.md` - Markdown files

#### Features

- **Document Discovery**: Automatically finds supported document types in the directory
- **File Summary**: Shows count, types, and sizes of documents before processing
- **User Confirmation**: Requires confirmation before processing begins
- **Organization Selection**: Interactive selection of target organization if not specified
- **Parallel Batch Processing**: Processes 5 files concurrently per batch to maximize throughput while respecting AI service limits
- **Progress Tracking**: Real-time progress updates for each document
- **Deduplication**: Automatically detects existing projects from the same file
- **Error Handling**: Continues processing even if individual files fail
- **Results Summary**: Detailed report of successful, failed, and duplicate projects

#### Processing Quality Levels

- **low**: Faster processing, basic extraction
- **medium**: Balanced speed and quality (default)
- **high**: More thorough analysis, slower processing

#### Examples

```bash
# Process all documents in a folder with default settings
npm run extract:batch ./project-briefs

# Process with specific organization and high quality
npm run extract:batch ./documents -- --org=org-123 --quality=high

# Show help
npm run extract:batch -- --help

# Process documents from examples directory
npm run extract:batch ../examples
```

#### Output

The script provides:
- Real-time progress for each document
- Success/failure status for each file
- Final summary with statistics
- List of any errors encountered
- Links to view created projects

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
- `npm run extract:batch` - Batch extract projects from documents in a directory

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
