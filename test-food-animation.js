const chalk = require('chalk');

console.log('🐟 TESTING KOII FOOD ANIMATION WITH FIXED SEAWEED 🐟\n');

function testKoiiFoodAnimation() {
  // Koii evolution stages
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

  // Crypto token tickers (top 100)
  const cryptoTickers = [
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'TRX', 'DOT', 'MATIC',
    'LTC', 'SHIB', 'AVAX', 'UNI', 'ATOM', 'LINK', 'XMR', 'ETC', 'BCH', 'NEAR',
    'APT', 'QNT', 'ICP', 'FIL', 'VET', 'HBAR', 'ALGO', 'MANA', 'SAND', 'CRO',
    'FLOW', 'CHZ', 'EGLD', 'XTZ', 'THETA', 'AXS', 'KLAY', 'USDC', 'USDT', 'DAI',
    'KOII', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BOME', 'POPCAT', 'MEW', 'NEIRO', 'GOAT'
  ];

  let currentStage = 0;
  let animationPhase = 'swimming';
  let cycles = 0;
  let swimPosition = 5;
  let seaweedOffset = 0;
  let foodEaten = 0;
  let lastEatenToken = '';
  let shouldExit = false;
  
  // Food positions (colons) - Performance optimized, well-spaced
  const foodPositions = [30, 50, 70, 90, 110, 130, 150, 170, 190, 210, 230, 250, 270, 290, 310, 330, 350, 370, 390, 410, 430, 450, 470];

  // Function to generate ocean floor with moving seaweed (fixed direction)
  const generateOceanFloor = (offset) => {
    const floorLength = 80;
    const seaweedPositions = [15, 25, 35, 45];
    let floor = '_'.repeat(floorLength);
    
    seaweedPositions.forEach(pos => {
      // Reverse the offset direction so seaweed moves left (opposite to current flow)
      const adjustedPos = (pos - offset + floorLength) % floorLength;
      if (adjustedPos >= 0 && adjustedPos < floor.length) {
        floor = floor.substring(0, adjustedPos) + '}' + floor.substring(adjustedPos + 1);
      }
    });
    
    return floor;
  };

  // Function to generate food line (shows a window around the Koii)
  const generateFoodLine = () => {
    const lineLength = 80;
    const windowStart = Math.max(0, Math.floor(swimPosition) - 40);
    const windowEnd = windowStart + lineLength;
    let foodLine = ' '.repeat(lineLength);
    
    foodPositions.forEach(pos => {
      const relativePos = pos - windowStart;
      if (relativePos >= 0 && relativePos < lineLength - 1) {
        foodLine = foodLine.substring(0, relativePos) + '::' + foodLine.substring(relativePos + 2);
      }
    });
    
    return foodLine;
  };

  // Function to check if Koii ate food
  const checkFoodCollision = () => {
    const koiiEnd = swimPosition + koiiStages[currentStage].length;
    for (let i = foodPositions.length - 1; i >= 0; i--) {
      const foodPos = foodPositions[i];
      if (swimPosition <= foodPos && koiiEnd >= foodPos) {
        foodPositions.splice(i, 1);
        foodEaten++;
        // Pick a random crypto ticker
        lastEatenToken = cryptoTickers[Math.floor(Math.random() * cryptoTickers.length)];
        return true;
      }
    }
    return false;
  };
  
  // Function to replenish food when running low - performance optimized
  const replenishFood = () => {
    if (foodPositions.length < 8) {
      // Add well-spaced food at strategic positions
      const newFoodSpots = [60, 120, 180, 240, 300, 360, 420, 480];
      newFoodSpots.forEach(pos => {
        if (!foodPositions.includes(pos)) {
          foodPositions.push(pos);
        }
      });
      foodPositions.sort((a, b) => a - b);
    }
  };

  // Function to redraw the scene
  const redrawScene = (message, creature, position, showFood = false, justAte = false) => {
    console.clear();
    
    // Header
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                          KOII TASK CLI - FOOD ANIMATION TEST                  ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
    
    // Message with food counter and last eaten token
    const foodCounter = showFood ? ` (Food eaten: ${foodEaten})` : '';
    const tokenInfo = lastEatenToken ? ` | Last ate: ${lastEatenToken}` : '';
    console.log(chalk.magenta.bold((message + foodCounter + tokenInfo).padEnd(80)));
    
    // Water line above food
    if (showFood) {
      const waterLine = '~'.repeat(80);
      console.log(chalk.blue.bold(waterLine));
      
      // Food line
      const foodLine = generateFoodLine();
      console.log(chalk.red.bold(foodLine));
      
      // Fish line (right below food)
      const windowStart = Math.max(0, Math.floor(swimPosition) - 40);
      const relativePosition = Math.max(0, position - windowStart);
      const spaces = ' '.repeat(Math.min(79, relativePosition));
      
      // Add eating effect (*) at the front of the fish's mouth when it just ate
      const eatingEffect = justAte ? chalk.red.bold('*') : '';
      console.log(chalk.yellow.bold(`${spaces}${creature}${eatingEffect}`));
    } else {
      // Water line for non-eating phases
      const waterLine = '~'.repeat(80);
      console.log(chalk.blue.bold(waterLine));
      
      // Extra whitespace
      console.log('');
      
      // Creature (show in window relative to current position)
      const windowStart = Math.max(0, Math.floor(swimPosition) - 40);
      const relativePosition = Math.max(0, position - windowStart);
      const spaces = ' '.repeat(Math.min(79, relativePosition));
      console.log(chalk.yellow.bold(`${spaces}${creature}`));
    }
    
    // Extra whitespace below fish and above ocean floor
    console.log('');
    
    // Ocean floor
    const oceanFloor = generateOceanFloor(seaweedOffset);
    console.log(chalk.green.bold(oceanFloor));
    
    // Debug info
    console.log(chalk.gray(`\nPhase: ${animationPhase} | Cycle: ${cycles} | Position: ${Math.floor(position)}/500 | Stage: ${currentStage} (${koiiStages[currentStage]}) | Food: ${foodEaten}`));
  };

  // Initial display
  redrawScene('A wild Koii appears in the ocean!', 'KOII', swimPosition);

  const animationInterval = setInterval(() => {
    cycles++;
    seaweedOffset += 1;
    
    switch (animationPhase) {
      case 'swimming':
        if (cycles < 20) {
          if (swimPosition < 20) swimPosition += 1;
          const swimMessage = swimPosition < 20 ? 'The Koii swims through the ocean...' : 'The Koii stops and the ocean flows around it...';
          redrawScene(swimMessage, 'KOII', swimPosition);
        } else {
          animationPhase = 'waking';
          cycles = 0;
        }
        break;
        
      case 'waking':
        if (cycles < 8) {
          redrawScene('The Koii is waking up!', 'KOII', swimPosition);
        } else {
          animationPhase = 'eating';
          cycles = 0;
          currentStage = 1; // Start with KO
        }
        break;
        
      case 'eating': {
        // Replenish food when running low
        replenishFood();
        
        // Move Koii forward to eat food - improved reset logic
        swimPosition += 0.5;
        
        // Reset position when reaching edge, with better performance
        if (swimPosition > 490) {
          swimPosition = 20;
        }
        
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
            redrawScene(`The Koii ate ${lastEatenToken}! Needs ${needed} more to evolve...`, koiiStages[currentStage], Math.floor(swimPosition), true, true);
          }
        } else if (ateFood) {
          // At max evolution, just show eating message
          redrawScene(`🍽️ The Koii ate ${lastEatenToken} and is satisfied!`, koiiStages[currentStage], Math.floor(swimPosition), true, true);
        } else {
          redrawScene('The Koii hunts for food...', koiiStages[currentStage], Math.floor(swimPosition), true, false);
        }
        break;
      }
        
      case 'evolving': {
        if (cycles < 15) {
          // Bubble evolution animation
          const bubbleFrames = [
            'oOOo*',
            'OoOO*',
            '*oOO*',
            'O*oO*',
            '*OoO*',
            'oO*O*',
            '*o*O*',
            'O*o**'
          ];
          const bubbleFrame = bubbleFrames[cycles % bubbleFrames.length];
          let evolutionMessage = '';
          if (currentStage === 1) {
            evolutionMessage = `✨ The Koii ate ${lastEatenToken} and is evolving! Eyes and tail are forming! ✨`;
          } else if (currentStage === 2) {
            evolutionMessage = `✨ The Koii ate ${lastEatenToken} and is evolving! First body segment growing! ✨`;
          } else {
            evolutionMessage = `✨ The Koii ate ${lastEatenToken} and is evolving! Body is getting bigger! ✨`;
          }
          
          redrawScene(evolutionMessage, bubbleFrame, Math.floor(swimPosition), true);
        } else {
          // Evolution complete
          currentStage++;
          let newFormMessage = '';
          if (currentStage === 2) {
            newFormMessage = `🎉 Evolution complete! The Koii gained eyes and tail ${koiiStages[currentStage]}! 🎉`;
          } else if (currentStage === 3) {
            newFormMessage = `🎉 Evolution complete! The Koii grew its first body segment ${koiiStages[currentStage]}! 🎉`;
          } else {
            newFormMessage = `🎉 Evolution complete! The Koii grew larger ${koiiStages[currentStage]}! 🎉`;
          }
          
          redrawScene(newFormMessage, koiiStages[currentStage], Math.floor(swimPosition), true);
          
          // Return to eating after showing new form
          setTimeout(() => {
            animationPhase = 'eating';
            cycles = 0;
          }, 1000);
        }
        break;
      }

    }
  }, 200);

  // Animation runs indefinitely - no timeout
  // Press Ctrl+C to stop the animation manually
}

testKoiiFoodAnimation(); 