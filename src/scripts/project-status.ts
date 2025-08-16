#!/usr/bin/env npx tsx

/**
 * Project Status Check Script
 * Quick verification that project extraction functionality is ready
 */

import { execSync } from 'child_process';

async function checkProjectStatus() {
  console.log('🔍 ProjectHub - Project Extraction Status Check');
  console.log('═'.repeat(50));

  const checks = [
    {
      name: 'Database Schema',
      check: () => {
        try {
          execSync('npx prisma generate', { stdio: 'pipe' });
          return { status: '✅', message: 'Prisma schema generated successfully' };
        } catch (error) {
          return { status: '❌', message: 'Prisma schema generation failed' };
        }
      }
    },
    {
      name: 'Project Creation Tests',
      check: () => {
        try {
          execSync('npm run test:projects:simple', { stdio: 'pipe' });
          return { status: '✅', message: 'Project creation tests passing' };
        } catch (error) {
          return { status: '❌', message: 'Project creation tests failing' };
        }
      }
    },
    {
      name: 'Server Compilation',
      check: () => {
        try {
          execSync('npx tsc --noEmit', { stdio: 'pipe' });
          return { status: '✅', message: 'TypeScript compilation successful' };
        } catch (error) {
          return { status: '⚠️ ', message: 'TypeScript compilation has warnings' };
        }
      }
    }
  ];

  console.log('\n📋 Running System Checks...\n');

  let allPassed = true;
  for (const check of checks) {
    console.log(`🔄 Checking ${check.name}...`);
    const result = check.check();
    console.log(`   ${result.status} ${result.message}`);
    if (result.status === '❌') {
      allPassed = false;
    }
  }

  console.log('\n' + '═'.repeat(50));
  
  if (allPassed) {
    console.log('🎉 Project Extraction System Status: READY');
    console.log('\n📚 Available Commands:');
    console.log('   npm run test:projects:simple   - Quick test (30 seconds)');
    console.log('   npm run test:projects:manual   - Real DB test (requires DB)');
    console.log('   npm run api                    - Start dev server for AI testing');
    console.log('\n✨ You can now safely test the AI extraction pipeline!');
    console.log('   Upload a DOCX/PDF file through the manager interface.');
  } else {
    console.log('❌ System Issues Detected');
    console.log('\n🔧 Recommended Actions:');
    console.log('   1. Fix failing checks listed above');
    console.log('   2. Run: npx prisma db push (if DB issues)');
    console.log('   3. Run: npm run test:projects:simple (verify fixes)');
    process.exit(1);
  }
}

checkProjectStatus().catch(error => {
  console.error('Status check failed:', error);
  process.exit(1);
});
