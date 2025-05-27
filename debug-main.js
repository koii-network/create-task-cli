const chalk = require('chalk');

console.log('🔍 DEBUGGING MAIN FUNCTION EXECUTION');

function displayKoiiAnimation() {
  console.log('📍 displayKoiiAnimation() called');
  console.clear();
  
  // Koii evolution stages
  const koiiStages = [
    'KOII',
    'KO',
    '-K--',
    'K--O',
    'K-°°)',
    'K--°°)',
    'K{{{°°)',
    'K{{{{°°)',
    'K{{{{{°°)',
    'K{{{{{{°°)'
  ];

  let currentStage = 0;
  let animationPhase = 'swimming';
  let cycles = 0;
  let swimPosition = 5;
  let seaweedOffset = 0;

  console.log('📍 Animation variables initialized');

  // Function to generate ocean floor with moving seaweed
  const generateOceanFloor = (offset) => {
    const floorLength = 60;
    const seaweedPositions = [15, 25, 35, 45];
    let floor = '_'.repeat(floorLength);
    
    seaweedPositions.forEach(pos => {
      const adjustedPos = (pos + offset) % floorLength;
      if (adjustedPos >= 0 && adjustedPos < floor.length) {
        floor = floor.substring(0, adjustedPos) + '}' + floor.substring(adjustedPos + 1);
      }
    });
    
    return floor;
  };

  // Function to redraw the scene
  const redrawScene = (message, creature, position) => {
    console.log(`📍 redrawScene called: ${message}`);
    console.clear();
    
    // Header
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                          KOII TASK CLI - LOADING...                          ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
    
    // Message
    console.log(chalk.magenta.bold(message.padEnd(60)));
    
    // Creature
    const spaces = ' '.repeat(Math.max(0, position));
    console.log(chalk.yellow.bold(`${spaces}${creature}`));
    
    // Ocean floor
    const oceanFloor = generateOceanFloor(seaweedOffset);
    console.log(chalk.green.bold(oceanFloor));
  };

  console.log('📍 About to call initial redrawScene');
  // Initial display
  redrawScene('A wild Koii appears in the ocean!', 'KOII', swimPosition);

  console.log('📍 About to create setInterval');
  const animationInterval = setInterval(() => {
    console.log(`📍 setInterval callback executed - cycle ${cycles + 1}`);
    cycles++;
    seaweedOffset += 1;
    
    switch (animationPhase) {
      case 'swimming':
        console.log(`📍 Swimming phase - cycles: ${cycles}/20`);
        if (cycles < 20) {
          if (swimPosition < 20) swimPosition += 1;
          const swimMessage = swimPosition < 20 ? 'The Koii swims through the ocean...' : 'The Koii stops and the ocean flows around it...';
          redrawScene(swimMessage, 'KOII', swimPosition);
        } else {
          console.log('📍 Transitioning to waking phase');
          animationPhase = 'waking';
          cycles = 0;
        }
        break;
        
      case 'waking':
        console.log(`📍 Waking phase - cycles: ${cycles}/8`);
        if (cycles < 8) {
          redrawScene('The Koii is waking up!', 'KOII', swimPosition);
        } else {
          console.log('📍 Transitioning to evolving phase');
          animationPhase = 'evolving';
          cycles = 0;
          currentStage = 1;
        }
        break;
        
      case 'evolving':
        console.log(`📍 Evolving phase - cycles: ${cycles}/30`);
        if (cycles < 30) {
          if (cycles % 3 === 0 && currentStage < koiiStages.length - 1) {
            currentStage++;
            console.log(`📍 Evolved to stage: ${koiiStages[currentStage]}`);
          }
          
          const isFlashing = cycles % 2 === 0;
          const displayStage = isFlashing ? koiiStages[currentStage] : '✨✨✨';
          
          redrawScene(`EVOLUTION! The Koii is now level ${Math.floor(currentStage/2) + 1}!`, displayStage, swimPosition);
        } else {
          console.log('📍 Animation complete - clearing interval');
          clearInterval(animationInterval);
          
          console.clear();
          console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
          console.log(chalk.cyan.bold('║                          KOII TASK CLI - READY!                              ║'));
          console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
          
          console.log(chalk.green.bold('🚀 The Koii has evolved into its final form! Ready to create tasks! 🚀'));
          console.log(chalk.cyan.bold(`Final Form: ${koiiStages[currentStage]}`));
          console.log('');
          
          setTimeout(() => {
            console.log('📍 Animation complete - would call continueWithMain()');
            console.log('✅ DEBUG: Animation function completed successfully!');
          }, 2000);
        }
        break;
    }
  }, 200);
  
  console.log('📍 setInterval created, returning from displayKoiiAnimation');
}

async function main() {
  console.log('📍 main() function called');
  displayKoiiAnimation();
  console.log('📍 main() function returning');
  return; // The animation will call continueWithMain() after completion
}

console.log('📍 About to call main()');
main().then(
  () => {
    console.log('📍 main() promise resolved');
    // Don't exit immediately - let the animation run
    console.log('📍 Keeping process alive for animation...');
  },
  (err) => {
    console.error('📍 main() promise rejected:', err);
    process.exit(-1);
  },
); 