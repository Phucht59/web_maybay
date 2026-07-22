const { startApps, stopApps } = require('./helpers/app');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      // Avoid traversing helper directory
      if (file !== 'helpers') {
        results = results.concat(findTestFiles(fullPath));
      }
    } else if (file.endsWith('.test.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

async function run() {
  let exitCode = 0;
  try {
    // 1. Start backend and frontend applications
    await startApps();
    
    // 2. Discover test files
    const testFiles = findTestFiles(__dirname);
    console.log('Discovered E2E test files:', testFiles);
    
    if (testFiles.length === 0) {
      console.log('No test files found to run.');
      return;
    }

    // 3. Execute Node's built-in test runner
    console.log('Running test suite...');
    const testProcess = spawn('node', ['--test', ...testFiles], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '../../')
    });
    
    exitCode = await new Promise((resolve) => {
      testProcess.on('exit', (code) => {
        resolve(code || 0);
      });
      testProcess.on('error', (err) => {
        console.error('Failed to start test process:', err);
        resolve(1);
      });
    });
  } catch (err) {
    console.error('Error during test execution:', err);
    exitCode = 1;
  } finally {
    // 4. Tear down the application servers
    try {
      await stopApps();
    } catch (stopErr) {
      console.error('Error stopping apps:', stopErr);
    }
    
    console.log(`Runner finished. Exit code: ${exitCode}`);
    process.exit(exitCode);
  }
}

run();
