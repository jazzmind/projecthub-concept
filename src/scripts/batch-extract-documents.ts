#!/usr/bin/env npx tsx

/**
 * Batch Document Extraction Script
 * 
 * This script processes documents in a directory using the ProjectConcept.extractFromDocument method.
 * It provides a summary of files found, asks for confirmation, then processes in batches of 5.
 */

import { ProjectConcept } from '../lib/concepts/project/project';
import { OrganizationConcept } from '../lib/concepts/common/organization';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Supported file extensions for document processing
const SUPPORTED_EXTENSIONS = ['.doc', '.docx', '.pdf', '.txt', '.md'];
const BATCH_SIZE = 5;

interface ProcessingResult {
  filename: string;
  success: boolean;
  projectId?: string;
  projectTitle?: string;
  wasExisting?: boolean;
  error?: string;
}

interface BatchStats {
  totalFiles: number;
  processed: number;
  successful: number;
  failed: number;
  existing: number;
  errors: string[];
}

/**
 * Get user input from command line
 */
function getUserInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Discover documents in the specified directory
 */
function discoverDocuments(directoryPath: string): string[] {
  if (!fs.existsSync(directoryPath)) {
    throw new Error(`Directory does not exist: ${directoryPath}`);
  }

  const stat = fs.statSync(directoryPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${directoryPath}`);
  }

  const files = fs.readdirSync(directoryPath);
  const documentFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  return documentFiles.map(file => path.join(directoryPath, file));
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Display summary of discovered files
 */
function displaySummary(documentPaths: string[]): void {
  console.log('\n📁 Document Discovery Summary');
  console.log('═'.repeat(50));
  console.log(`📊 Total documents found: ${documentPaths.length}`);
  
  if (documentPaths.length === 0) {
    console.log('❌ No supported documents found.');
    console.log(`📝 Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    return;
  }

  console.log('\n📋 Files to process:');
  documentPaths.forEach((filePath, index) => {
    const filename = path.basename(filePath);
    const ext = path.extname(filePath);
    const stats = fs.statSync(filePath);
    const size = formatFileSize(stats.size);
    console.log(`  ${index + 1}. ${filename} (${ext}, ${size})`);
  });

  // Group by extension
  const extensionCounts: Record<string, number> = {};
  documentPaths.forEach(filePath => {
    const ext = path.extname(filePath).toLowerCase();
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
  });

  console.log('\n📊 By type:');
  Object.entries(extensionCounts).forEach(([ext, count]) => {
    console.log(`  ${ext}: ${count} file${count > 1 ? 's' : ''}`);
  });

  console.log(`\n⚡ Processing will be done in batches of ${BATCH_SIZE} files.`);
}

/**
 * Get or prompt for organization ID
 */
async function getOrganizationId(providedOrgId?: string): Promise<string> {
  const organizationConcept = new OrganizationConcept();

  // If org ID is provided, validate it
  if (providedOrgId) {
    const orgs = await organizationConcept._getById({ id: providedOrgId });
    if (orgs.length > 0) {
      console.log(`✅ Using organization: ${orgs[0].name} (${orgs[0].domain})`);
      return providedOrgId;
    } else {
      console.log(`❌ Organization ID not found: ${providedOrgId}`);
    }
  }

  // List available organizations
  const allOrgs = await organizationConcept._getAll({});
  if (allOrgs.length === 0) {
    throw new Error('No organizations found. Please create an organization first.');
  }

  console.log('\n🏢 Available organizations:');
  allOrgs.forEach((org, index) => {
    console.log(`  ${index + 1}. ${org.name} (${org.domain}) - ${org.organizationType}`);
  });

  const choice = await getUserInput('\nSelect organization (enter number): ');
  const selectedIndex = parseInt(choice) - 1;

  if (selectedIndex < 0 || selectedIndex >= allOrgs.length) {
    throw new Error('Invalid organization selection');
  }

  const selectedOrg = allOrgs[selectedIndex];
  console.log(`✅ Selected: ${selectedOrg.name} (${selectedOrg.domain})`);
  return selectedOrg.id;
}

/**
 * Process a single document
 */
async function processDocument(
  filePath: string,
  organizationId: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<ProcessingResult> {
  const filename = path.basename(filePath);
  const projectConcept = new ProjectConcept();

  try {
    console.log(`📄 Starting: ${filename}`);
    
    // Read file buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Process with minimal progress callback for parallel processing
    const result = await projectConcept.extractFromDocument({
      fileBuffer,
      originalFilename: filename,
      organizationId,
      quality,
      onProgress: (stage: string, progress: number) => {
        // Only show key milestones to avoid cluttered output during parallel processing
        if (progress === 15 || progress === 80 || progress === 100) {
          console.log(`  📊 ${filename}: ${stage} (${Math.round(progress)}%)`);
        }
      }
    });

    if ('project' in result) {
      return {
        filename,
        success: true,
        projectId: result.project.id,
        projectTitle: result.project.title,
        wasExisting: result.wasExisting
      };
    } else {
      return {
        filename,
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    return {
      filename,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process documents in batches
 */
async function processBatches(
  documentPaths: string[],
  organizationId: string,
  quality: 'low' | 'medium' | 'high'
): Promise<BatchStats> {
  const stats: BatchStats = {
    totalFiles: documentPaths.length,
    processed: 0,
    successful: 0,
    failed: 0,
    existing: 0,
    errors: []
  };

  // Process in batches
  for (let i = 0; i < documentPaths.length; i += BATCH_SIZE) {
    const batch = documentPaths.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(documentPaths.length / BATCH_SIZE);

    console.log(`\n🔄 Processing Batch ${batchNumber}/${totalBatches} (${batch.length} files in parallel)`);
    console.log('─'.repeat(60));

    // Process batch in parallel (up to BATCH_SIZE concurrent extractions)
    const batchPromises = batch.map(filePath => 
      processDocument(filePath, organizationId, quality)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Process results and update stats
    batchResults.forEach(result => {
      stats.processed++;

      if (result.success) {
        stats.successful++;
        if (result.wasExisting) {
          stats.existing++;
          console.log(`  ♻️  ${result.filename} → Existing project: ${result.projectTitle}`);
        } else {
          console.log(`  ✅ ${result.filename} → Created: ${result.projectTitle}`);
        }
      } else {
        stats.failed++;
        stats.errors.push(`${result.filename}: ${result.error}`);
        console.log(`  ❌ ${result.filename} → Error: ${result.error}`);
      }
    });

    // Longer delay between batches
    if (i + BATCH_SIZE < documentPaths.length) {
      console.log('\n⏳ Waiting before next batch...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return stats;
}

/**
 * Display final results
 */
function displayResults(stats: BatchStats): void {
  console.log('\n' + '═'.repeat(60));
  console.log('🎯 Batch Processing Complete');
  console.log('═'.repeat(60));
  
  console.log(`📊 Total files: ${stats.totalFiles}`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`♻️  Existing projects: ${stats.existing}`);
  console.log(`❌ Failed: ${stats.failed}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  }

  const successRate = stats.totalFiles > 0 ? (stats.successful / stats.totalFiles * 100).toFixed(1) : '0';
  console.log(`\n📈 Success rate: ${successRate}%`);
  
  if (stats.successful > 0) {
    console.log('\n🎉 Projects can be viewed at: http://localhost:3000/projects');
  }
}

/**
 * Main script function
 */
async function main() {
  try {
    console.log('🚀 ProjectHub - Batch Document Extraction');
    console.log('═'.repeat(50));

    // Parse command line arguments
    const args = process.argv.slice(2);
    const directoryArg = args.find(arg => !arg.startsWith('--'));
    const orgIdArg = args.find(arg => arg.startsWith('--org='))?.split('=')[1];
    const qualityArg = args.find(arg => arg.startsWith('--quality='))?.split('=')[1] as 'low' | 'medium' | 'high';
    const helpRequested = args.includes('--help') || args.includes('-h');

    if (helpRequested) {
      console.log('\nUsage: npx tsx scripts/batch-extract-documents.ts [directory] [options]');
      console.log('\nOptions:');
      console.log('  --org=<id>          Organization ID (will prompt if not provided)');
      console.log('  --quality=<level>   Extraction quality: low, medium, high (default: medium)');
      console.log('  --help, -h          Show this help message');
      console.log('\nExamples:');
      console.log('  npx tsx scripts/batch-extract-documents.ts ./documents');
      console.log('  npx tsx scripts/batch-extract-documents.ts ./docs --org=org123 --quality=high');
      return;
    }

    if (!directoryArg) {
      throw new Error('Please provide a directory path. Use --help for usage information.');
    }

    const directoryPath = path.resolve(directoryArg);
    const quality = qualityArg || 'medium';

    // Validate quality argument
    if (!['low', 'medium', 'high'].includes(quality)) {
      throw new Error('Quality must be one of: low, medium, high');
    }

    console.log(`📁 Directory: ${directoryPath}`);
    console.log(`⚡ Quality: ${quality}`);

    // Discover documents
    const documentPaths = discoverDocuments(directoryPath);
    displaySummary(documentPaths);

    if (documentPaths.length === 0) {
      process.exit(0);
    }

    // Get confirmation
    const proceed = await getUserInput('\n❓ Proceed with processing? (y/N): ');
    if (!['y', 'yes'].includes(proceed.toLowerCase())) {
      console.log('❌ Cancelled by user.');
      process.exit(0);
    }

    // Get organization ID
    const organizationId = await getOrganizationId(orgIdArg);

    // Process documents
    console.log('\n🚀 Starting batch processing...');
    const stats = await processBatches(documentPaths, organizationId, quality);

    // Display results
    displayResults(stats);

  } catch (error) {
    console.error(`\n💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
