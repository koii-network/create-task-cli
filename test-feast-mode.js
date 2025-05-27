const chalk = require('chalk');

console.log('🍽️ KOII FEAST MODE - MAXIMUM FOOD! 🍽️\n');

function testFeastMode() {
  const koiiStages = [
    'KOII',          // Stage 0: Initial form
    'KO',            // Stage 1: Basic form after waking
    'KO°°)',         // Stage 2: Gains eyes and tail
    'K(°°)',         // Stage 3: First body segment
    'K((°°)',        // Stage 4: Second body segment  
    'K(((°°)',       // Stage 5: Third body segment
    'K((((°°)',      // Stage 6: Fourth body segment
    'K(((((°°)',     // Stage 7: Fifth body segment
    'K((((((°°)',    // Stage 8: Sixth body segment
    'K(((((((°°)'    // Stage 9: Ultimate form
  ];

  // Evolution requirements - food needed for each stage (1.5x scaling)
  // Index 0: KOII (0 food), Index 1: KO (2 food), Index 2: KO°°) (3 food), etc.
  const evolutionRequirements = [0, 2, 3, 5, 8, 12, 18, 27, 41];

  // Crypto token tickers
  const cryptoTickers = [
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'TRX', 'DOT', 'MATIC',
    'LTC', 'SHIB', 'AVAX', 'UNI', 'ATOM', 'LINK', 'XMR', 'ETC', 'BCH', 'NEAR',
    'KOII', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BOME', 'POPCAT', 'MEW', 'NEIRO', 'GOAT'
  ];

  let currentStage = 1; // Start as KO
  let animationPhase = 'eating';
  let cycles = 0;
  let swimPosition = 20;
  let seaweedOffset = 0;
  let foodEaten = 0;
  let lastEatenToken = '';
  
  // OPTIMIZED FOOD BUFFET! Well-spaced for performance
  const foodPositions = [];
  for (let i = 30; i <= 450; i += 20) {
    foodPositions.push(i);
  }
  
  console.log(chalk.green.bold(`🍽️ FEAST PREPARED! ${foodPositions.length} pieces of food available!`));

  const generateOceanFloor = (offset) => {
    const floorLength = 80;
    const seaweedPositions = [15, 25, 35, 45];
    let floor = '_'.repeat(floorLength);
    
    seaweedPositions.forEach(pos => {
      const adjustedPos = (pos - offset + floorLength) % floorLength;
      if (adjustedPos >= 0 && adjustedPos < floor.length) {
        floor = floor.substring(0, adjustedPos) + '}' + floor.substring(adjustedPos + 1);
      }
    });
    
    return floor;
  };

  const generateFoodLine = () => {
    const lineLength = 80;
    const windowStart = Math.max(0, Math.floor(swimPosition) - 40);
    let foodLine = ' '.repeat(lineLength);
    
    foodPositions.forEach(pos => {
      const relativePos = pos - windowStart;
      if (relativePos >= 0 && relativePos < lineLength - 1) {
        foodLine = foodLine.substring(0, relativePos) + '::' + foodLine.substring(relativePos + 2);
      }
    });
    
    return foodLine;
  };

  const checkFoodCollision = () => {
    const koiiEnd = swimPosition + koiiStages[currentStage].length;
    for (let i = foodPositions.length - 1; i >= 0; i--) {
      const foodPos = foodPositions[i];
      if (swimPosition <= foodPos && koiiEnd >= foodPos) {
        foodPositions.splice(i, 1);
        foodEaten++;
        lastEatenToken = cryptoTickers[Math.floor(Math.random() * cryptoTickers.length)];
        return true;
      }
    }
    return false;
  };

  const redrawScene = (message, creature, justAte = false) => {
    console.clear();
    
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                          KOII FEAST MODE - MAXIMUM FOOD!                     ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
    
    const foodCounter = ` (Food eaten: ${foodEaten}/${foodPositions.length + foodEaten})`;
    const tokenInfo = lastEatenToken ? ` | Last ate: ${lastEatenToken}` : '';
    const nextEvolution = currentStage < koiiStages.length - 1 ? 
      ` | Next evolution: ${evolutionRequirements[currentStage + 1] - foodEaten} more` : ' | MAX LEVEL!';
    
    console.log(chalk.magenta.bold(message + foodCounter + tokenInfo + nextEvolution));
    
    // Water line above food
    const waterLine = '~'.repeat(80);
    console.log(chalk.blue.bold(waterLine));
    
    // Food line
    const foodLine = generateFoodLine();
    console.log(chalk.red.bold(foodLine));
    
    // Fish line (right below food)
    const windowStart = Math.max(0, Math.floor(swimPosition) - 40);
    const relativePosition = Math.max(0, swimPosition - windowStart);
    const spaces = ' '.repeat(Math.min(79, relativePosition));
    
    // Add eating effect (*) at the front of the fish's mouth when it just ate
    const eatingEffect = justAte ? chalk.red.bold('*') : '';
    console.log(chalk.yellow.bold(`${spaces}${creature}${eatingEffect}`));
    
    console.log('');
    
    // Ocean floor
    const oceanFloor = generateOceanFloor(seaweedOffset);
    console.log(chalk.green.bold(oceanFloor));
    
    console.log(chalk.gray(`\nCycle: ${cycles} | Position: ${Math.floor(swimPosition)} | Stage: ${currentStage} (${creature}) | Food remaining: ${foodPositions.length}`));
  };

  // Initial display
  redrawScene('🍽️ FEAST MODE ACTIVATED! The Koii approaches the buffet!', koiiStages[currentStage]);

  const animationInterval = setInterval(() => {
    cycles++;
    seaweedOffset += 1;
    
    switch (animationPhase) {
      case 'eating': {
        // Move Koii forward faster to eat more
        swimPosition += 1.0; // Faster movement
        
        // Check for food collision
        const ateFood = checkFoodCollision();
        
        // Check if ready to evolve (only when exact requirement is met)
        if (ateFood && currentStage < koiiStages.length - 1) {
          const requiredFood = evolutionRequirements[currentStage + 1];
          if (foodEaten === requiredFood) {
            // Start evolution animation - only when exact requirement is met
            animationPhase = 'evolving';
            cycles = 0;
          } else {
            const needed = requiredFood - foodEaten;
            redrawScene(`🍽️ CHOMP! The Koii ate ${lastEatenToken}! Needs ${needed} more to evolve!`, koiiStages[currentStage], true);
          }
        } else if (ateFood) {
          // At max evolution, just show eating message
          redrawScene(`🍽️ MAXIMUM POWER! The Koii ate ${lastEatenToken}!`, koiiStages[currentStage], true);
        } else {
          redrawScene('🍽️ The Koii devours the ocean buffet!', koiiStages[currentStage], false);
        }
        
        // Reset position when reaching edge - improved performance
        if (swimPosition > 470) {
          swimPosition = 20;
        }
        break;
      }
        
      case 'evolving': {
        if (cycles < 8) { // Faster evolution
          const bubbleFrames = ['oOOo*', 'OoOO*', '*oOO*', 'O*oO*', '*OoO*', 'oO*O*', '*o*O*', 'O*o**'];
          const bubbleFrame = bubbleFrames[cycles % bubbleFrames.length];
          let evolutionMessage = '';
          if (currentStage === 1) {
            evolutionMessage = `✨ EVOLUTION! The Koii ate ${lastEatenToken} and gained eyes and tail! ✨`;
          } else if (currentStage === 2) {
            evolutionMessage = `✨ EVOLUTION! The Koii ate ${lastEatenToken} and grew first body segment! ✨`;
          } else {
            evolutionMessage = `✨ EVOLUTION! The Koii ate ${lastEatenToken} and grew bigger! ✨`;
          }
          
          redrawScene(evolutionMessage, bubbleFrame, false);
        } else {
          // Evolution complete
          currentStage++;
          let newFormMessage = '';
          if (currentStage === 2) {
            newFormMessage = `🎉 EYES AND TAIL GAINED! ${koiiStages[currentStage]} is ready to feast more! 🎉`;
          } else if (currentStage === 3) {
            newFormMessage = `🎉 FIRST BODY SEGMENT! ${koiiStages[currentStage]} continues the feast! 🎉`;
          } else {
            newFormMessage = `🎉 BIGGER FISH! ${koiiStages[currentStage]} continues the feast! 🎉`;
          }
          
          redrawScene(newFormMessage, koiiStages[currentStage], false);
          
          // Return to eating immediately
          setTimeout(() => {
            animationPhase = 'eating';
            cycles = 0;
          }, 500);
        }
        break;
      }
    }
    
    // Stop when all food is eaten or max evolution reached
    if (foodPositions.length === 0 || (currentStage === koiiStages.length - 1 && foodEaten >= evolutionRequirements[evolutionRequirements.length - 1])) {
      clearInterval(animationInterval);
      console.clear();
      console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
      console.log(chalk.cyan.bold('║                          FEAST COMPLETE!                                     ║'));
      console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
      
      console.log(chalk.green.bold('🎉 THE KOII HAS CONSUMED THE ENTIRE OCEAN! 🎉'));
      console.log(chalk.cyan.bold(`🐟 Final form: ${koiiStages[currentStage]}`));
      console.log(chalk.yellow.bold(`🍽️ Total food consumed: ${foodEaten}`));
      if (lastEatenToken) {
        console.log(chalk.magenta.bold(`🪙 Last crypto devoured: ${lastEatenToken}`));
      }
      console.log(chalk.red.bold('\n🌊 THE OCEAN TREMBLES BEFORE THIS MIGHTY KOII! 🌊'));
    }
  }, 150); // Faster animation
}

testFeastMode(); 