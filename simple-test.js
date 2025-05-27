console.log('🔍 Testing setInterval in Node.js environment...');

let counter = 0;

console.log('Starting test...');

const testInterval = setInterval(() => {
  counter++;
  console.log(`Interval tick: ${counter}`);
  
  if (counter >= 5) {
    clearInterval(testInterval);
    console.log('✅ setInterval test completed successfully!');
    
    // Now test the animation logic
    console.log('\n🎬 Testing animation logic...');
    testAnimationLogic();
  }
}, 500);

function testAnimationLogic() {
  let cycles = 0;
  let phase = 'swimming';
  
  const animationInterval = setInterval(() => {
    cycles++;
    console.log(`Animation cycle: ${cycles}, Phase: ${phase}`);
    
    if (cycles >= 3) {
      phase = 'waking';
      console.log('🔄 Phase changed to waking');
    }
    
    if (cycles >= 6) {
      clearInterval(animationInterval);
      console.log('✅ Animation logic test completed!');
      console.log('The issue is not with setInterval or basic logic.');
    }
  }, 300);
} 