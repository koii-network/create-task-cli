const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 OOP Animation Auto-Watch System Started');
console.log('👀 Monitoring TypeScript files for changes...');
console.log('🏗️  Will auto-build and test OOP animation on changes\n');

// Files to watch
const watchPaths = [
  'src/animation/',
  'src/main-oop.ts',
  'test-oop-animation.js'
];

// Track last modification times to avoid duplicate triggers
const lastModified = new Map();

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildAndTest() {
  try {
    console.log('\n📦 Building TypeScript...');
    await runCommand('npm', ['run', 'build']);
    
    console.log('\n🎬 Testing OOP Animation...');
    await runCommand('node', ['test-oop-animation.js']);
    
    console.log('\n✅ Build and test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Build or test failed:', error.message);
  }
  
  console.log('\n👀 Watching for more changes...\n');
}

function watchFile(filePath) {
  fs.watch(filePath, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    const fullPath = path.join(filePath, filename);
    
    // Only watch TypeScript and JavaScript files
    if (!filename.match(/\.(ts|js)$/)) return;
    
    // Check if file actually changed (avoid duplicate events)
    try {
      const stats = fs.statSync(fullPath);
      const lastMod = lastModified.get(fullPath);
      
      if (lastMod && stats.mtime.getTime() === lastMod) {
        return; // No actual change
      }
      
      lastModified.set(fullPath, stats.mtime.getTime());
      
      console.log(`📝 File changed: ${filename}`);
      buildAndTest();
      
    } catch (error) {
      // File might have been deleted, ignore
    }
  });
}

// Start watching all specified paths
watchPaths.forEach(watchPath => {
  if (fs.existsSync(watchPath)) {
    console.log(`👁️  Watching: ${watchPath}`);
    watchFile(watchPath);
  } else {
    console.log(`⚠️  Path not found: ${watchPath}`);
  }
});

// Initial build and test
console.log('🏗️  Running initial build and test...');
buildAndTest();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 OOP Animation watch stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 OOP Animation watch terminated');
  process.exit(0);
}); 