const { KoiiAnimationEngine } = require('./build/animation/KoiiAnimationEngine');

console.log('🐟 TESTING NEW OOP KOII ANIMATION ENGINE 🐟\n');

async function testOOPAnimation() {
  try {
    // Create animation engine with custom configuration
    const animationEngine = new KoiiAnimationEngine({
      frameRate: 150,  // Slightly faster for testing
      foodSpacing: 15, // More food for faster evolution
      maxPosition: 400 // Smaller ocean for quicker testing
    });

    console.log('🚀 Starting OOP Koii Animation...');
    console.log('✨ Features:');
    console.log('  • Object-oriented architecture');
    console.log('  • Separation of concerns');
    console.log('  • Clean class structure');
    console.log('  • Configurable parameters');
    console.log('  • Type safety with TypeScript');
    console.log('  • Proper encapsulation\n');

    // Start the animation
    await animationEngine.start();

    // Animation completed (user pressed spacebar)
    console.log('\n🎉 OOP Animation test completed successfully!');
    console.log(`📊 Final Stats:`);
    console.log(`   • Stage: ${animationEngine.getCurrentStage()}`);
    console.log(`   • Food Eaten: ${animationEngine.getFoodEaten()}`);
    console.log(`   • Position: ${Math.floor(animationEngine.getKoiiPosition())}`);
    console.log(`   • Phase: ${animationEngine.getAnimationPhase()}`);

  } catch (error) {
    console.error('❌ Animation test failed:', error);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Animation interrupted by user');
  process.exit(0);
});

testOOPAnimation(); 