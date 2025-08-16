#!/usr/bin/env npx tsx

/**
 * Test runner for project extraction functionality
 * This script runs tests to validate project creation and saving works correctly
 * without requiring full AI pipeline execution.
 */

import { execSync } from 'child_process';
import path from 'path';

const testSuites = [
  {
    name: 'Simple Project Tests',
    path: 'tests/simple-project.test.ts',
    description: 'Basic project creation and query tests with mocked database'
  },
  {
    name: 'Project Extraction Core Tests',
    path: 'tests/project-extraction.test.ts',
    description: 'Tests project creation from extracted data with mocked AI services'
  },
  {
    name: 'API Endpoint Tests', 
    path: 'tests/api/project-extraction-api.test.ts',
    description: 'Tests REST API endpoints for project extraction'
  },
  {
    name: 'Integration Flow Tests',
    path: 'tests/integration/project-creation-flow.test.ts', 
    description: 'Tests complete project creation flow with real database operations'
  }
];

async function runTest(testSuite: typeof testSuites[0]) {
  console.log(`\n🧪 Running: ${testSuite.name}`);
  console.log(`📝 ${testSuite.description}`);
  console.log(`📁 ${testSuite.path}`);
  console.log('─'.repeat(60));

  try {
    const command = `npx jest ${testSuite.path} --verbose --detectOpenHandles`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${testSuite.name} - PASSED`);
  } catch (error) {
    console.log(`❌ ${testSuite.name} - FAILED`);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 ProjectHub - Project Extraction Test Suite');
  console.log('═'.repeat(60));
  console.log('Testing project creation and saving functionality');
  console.log('without requiring full AI pipeline execution.\n');

  let passed = 0;
  let failed = 0;

  for (const testSuite of testSuites) {
    try {
      await runTest(testSuite);
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n💥 ${testSuite.name} failed with error:`, error);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('─'.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Project extraction functionality is working correctly.');
    console.log('✨ You can now safely test the full AI pipeline with confidence.');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before proceeding.');
    process.exit(1);
  }
}

// Allow running specific test suites
const testArg = process.argv[2];
if (testArg) {
  const testSuite = testSuites.find(t => 
    t.name.toLowerCase().includes(testArg.toLowerCase()) ||
    t.path.includes(testArg)
  );
  
  if (testSuite) {
    console.log(`🎯 Running specific test: ${testSuite.name}`);
    runTest(testSuite).catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
  } else {
    console.log(`❌ Test not found: ${testArg}`);
    console.log('Available tests:');
    testSuites.forEach(t => console.log(`  - ${t.name}`));
    process.exit(1);
  }
} else {
  // Run all tests
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
