const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 KOII Animation Auto-Watcher Started!');
console.log('👀 Watching for changes in src/main.ts...');
console.log('🎬 Will automatically run animation test on changes\n');

let isRunning = false;
let changeTimeout = null;

// Function to run the animation test
function runAnimationTest() {
  if (isRunning) {
    console.log('⏳ Animation already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('\n🎬 Running animation test...\n');
  
  // Run the animation test
  const testProcess = spawn('node', ['test-food-animation.js'], {
    stdio: 'inherit',
    shell: true
  });

  // No timeout - let animation run until naturally completed or manually stopped

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Animation test completed successfully');
    } else if (code !== null) {
      console.log(`\n🔄 Animation test ended (code: ${code})`);
    }
    console.log('👀 Watching for more changes...\n');
    isRunning = false;
  });

  testProcess.on('error', (err) => {
    console.log('\n❌ Error running animation test:', err.message);
    console.log('👀 Watching for more changes...\n');
    isRunning = false;
  });
}

// Debounced run function
function debouncedRun() {
  if (changeTimeout) {
    clearTimeout(changeTimeout);
  }
  
  changeTimeout = setTimeout(() => {
    runAnimationTest();
  }, 1000); // Wait 1 second after last change
}

// Watch the main TypeScript file
const watchFile = path.join(__dirname, 'src', 'main.ts');

if (fs.existsSync(watchFile)) {
  fs.watchFile(watchFile, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log(`📝 File changed: ${new Date().toLocaleTimeString()}`);
      debouncedRun();
    }
  });
  
  console.log(`✅ Watching: ${watchFile}`);
  console.log('💡 Make changes to src/main.ts to see the animation update!');
  console.log('🛑 Press Ctrl+C to stop watching\n');
  
  // Run initial animation test
  console.log('🚀 Running initial animation test...');
  runAnimationTest();
  
} else {
  console.error('❌ Could not find src/main.ts to watch');
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping animation watcher...');
  fs.unwatchFile(watchFile);
  console.log('👋 Goodbye!');
  process.exit(0);
});

// Keep the process alive
process.stdin.resume(); 