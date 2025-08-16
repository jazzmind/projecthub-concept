#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Running project import script...');

// Get command line arguments
const args = process.argv.slice(2);

// Run the TypeScript version using tsx
const scriptPath = path.join(__dirname, 'import-projects.ts');
let command = `npx tsx "${scriptPath}"`;

// Add any command line arguments
if (args.length > 0) {
  command += ' ' + args.join(' ');
}

console.log(`📝 Executing: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error executing script: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`⚠️  Script warnings: ${stderr}`);
  }
  
  console.log(stdout);
  
  console.log('\n✅ Import script completed successfully!');
});
