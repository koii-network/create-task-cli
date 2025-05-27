#!/usr/bin/env node

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  updateTask,
  SetActive,
  ClaimReward,
  FundTask,
  Withdraw,
} from './koii_task_contract/koii_task_contract';
import { Connection as SolanaConnection } from '@solana/web3.js';
import { checkIsKPLTask } from './utils/task_type';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@_koii/web3.js';
import ora from 'ora';
import chalk from 'chalk';
import {
  createTask as KPLCreateTask,
  establishPayer as KPLEstablishPayer,
  establishConnection as KPLEstablishConnection,
  checkProgram as KPLCheckProgram,
  FundTask as KPLFundTask,
  ClaimReward as KPLClaimReward,
  SetActive as KPLSetActive,
  Withdraw as KPLWithdraw,
  updateTask as KPLUpdateTask,
} from './kpl_task_contract/task-program';
import {
  uploadExecutableFileToIpfs,
  uploadMetaDataFileToIpfs,
  manualEnterIPFSCIDs,
  validateEligibilityForIPFSUpload
} from './utils/ipfs';

import {
  Keypair as SolanaKeypair,
  PublicKey as SolanaPublicKey,
} from '@solana/web3.js';
import fs from 'fs';
import { config } from 'dotenv';
import handleMetadata from './utils/metadata';
import validateTaskInputs from './utils/validate';
import validateUpdateTaskInputs from './utils/validateUpdate';
import {
  getStakingWalletPath,
  getPayerWalletPath,
  getYmlPath,
  getClaimerWalletPath,
  getSubmitterWalletPath,
  sanitizePath,
} from './utils/get_wallet_path';
import readYamlFile from 'read-yaml-file';
import { promptWithCancel } from './utils/prompts';
import downloadRepo from './utils/download_repo';
import { Task, TaskMetadata } from './utils/validate';
import { UpdateTask } from './utils/validateUpdate';
import getTokenBalance from './utils/token';
import { getTaskStateInfo } from './utils/task_state';
config();
process.on('SIGINT', () => {
  console.log('\nExiting...');
  process.exit(0);
});
const warningEmoji = '\u26A0';
async function initializeConnection() {
  let payerWallet: Keypair;
  const walletPath = await getPayerWalletPath();

  try {
    const wallet = fs.readFileSync(walletPath, 'utf-8');
    payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet)));
    console.log(
      "Fee Payer Wallet Path: ",
      chalk.yellowBright(walletPath),
      "Address:", 
      chalk.yellowBright(payerWallet.publicKey.toBase58()),
    );
  } catch (e) {
    console.log(chalk.red('Your wallet is not valid'));
    //console.error(logSymbols.error, "Wallet is not valid");
    process.exit();
  }
  // Establish connection to the cluster
  const connection = await establishConnection();
  await KPLEstablishConnection();

  // Determine who pays for the fees
  await establishPayer(payerWallet);
  await KPLEstablishPayer(payerWallet as unknown as SolanaKeypair);

  // Check if the program has been deployed
  await checkProgram();
  try {
    await KPLCheckProgram();
  } catch (e) {
    console.log(`${warningEmoji} ${chalk.red.bold(String(e))}`);
  }
  return { walletPath, payerWallet, connection };
}

// ASCII Art Animation Function - Koii Evolution with Food System
function displayKoiiAnimation() {
  console.clear();
  
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
  
  // Food positions (colons) - anchored to map positions, well-spaced for performance
  const foodPositions = [30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480];
  
  // Setup keyboard input for spacebar cancellation
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    if (key.toString() === ' ') {
      shouldExit = true;
    }
  });

  // Function to generate ocean floor with moving seaweed (fixed direction)
  const generateOceanFloor = (offset: number) => {
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
    if (foodPositions.length < 10) {
      // Add well-spaced food at strategic positions
      const newFoodSpots = [50, 100, 150, 200, 250, 300, 350, 400, 450];
      newFoodSpots.forEach(pos => {
        if (!foodPositions.includes(pos)) {
          foodPositions.push(pos);
        }
      });
      foodPositions.sort((a, b) => a - b);
    }
  };

  // Function to redraw the scene
  const redrawScene = (message: string, creature: string, position: number, showFood = false, justAte = false) => {
    console.clear();
    
    // Header
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                          KOII TASK CLI - LOADING...                          ║'));
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
    
    // Instructions
    console.log(chalk.gray('\nPress SPACEBAR to exit and continue to CLI menu...'));
  };

  // Initial display
  redrawScene('🌊 A wild Koii appears in the ocean! 🌊', 'KOII', swimPosition);

  const animationInterval = setInterval(() => {
    // Check for spacebar exit
    if (shouldExit) {
      clearInterval(animationInterval);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      
      console.clear();
      console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════════════╗'));
      console.log(chalk.cyan.bold('║                          KOII TASK CLI - READY!                              ║'));
      console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════════════╝\n'));
      
      console.log(chalk.green.bold('🚀 Animation stopped! Ready to create tasks! 🚀'));
      console.log(chalk.cyan.bold(`Final Form: ${koiiStages[currentStage]} (Food eaten: ${foodEaten})`));
      if (lastEatenToken) {
        console.log(chalk.yellow.bold(`Last crypto eaten: ${lastEatenToken}`));
      }
      console.log('');
      
      setTimeout(() => {
        if ((global as any).animationComplete) {
          (global as any).animationComplete();
        }
        continueWithMain();
      }, 1000);
      return;
    }
    
    cycles++;
    seaweedOffset += 1;
    
    switch (animationPhase) {
      case 'swimming':
        if (cycles < 20) {
          if (swimPosition < 20) swimPosition += 1;
          const swimMessage = swimPosition < 20 ? '🏊‍♂️ The Koii swims through the ocean...' : '🛑 The Koii stops and the ocean flows around it...';
          redrawScene(swimMessage, 'KOII', swimPosition);
        } else {
          animationPhase = 'waking';
          cycles = 0;
        }
        break;
        
      case 'waking':
        if (cycles < 8) {
          redrawScene('😴 The Koii is waking up! ☀️', 'KOII', swimPosition);
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
          redrawScene('🍽️ The Koii hunts for food...', koiiStages[currentStage], Math.floor(swimPosition), true, false);
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
}

async function main() {
  return new Promise<void>((resolve) => {
    displayKoiiAnimation();
    // The animation will call resolve() when complete
    (global as any).animationComplete = resolve;
  });
}

async function continueWithMain() {
console.log('🌱 Welcome to the KOII Create Task CLI!');
console.log('💡 For the best experience, consider installing the KOII CLI:');
console.log('   https://www.koii.network/docs/develop/category/koii-command-line-tool');
  let walletPath;
  const mode = (
    await promptWithCancel({
      type: 'select',
      name: 'mode',
      message: 'Select operation',

      choices: [
        { title: 'Create Local Repo', value: 'create-repo' },
        { title: 'Deploy a Task', value: 'create-task' },
        { title: 'Update a Task', value: 'update-task' },
        { title: 'Fund Task', value: 'fund-task' },
        { title: 'Activate/Deactivate Task', value: 'set-active' },
        { title: 'Claim Reward (For VPS Node)', value: 'claim-reward' },
        { title: 'Withdraw Stake (For VPS Node)', value: 'withdraw' },
        {
          title: 'Upload Assets to IPFS',
          value: 'handle-assets',
        },
      ],
    })
  ).mode;
  if (mode == 'create-task' || mode == 'update-task') {
    await promptWithCancel({
      type: 'text',
      name: 'confirm',
      message: `Did you run ${chalk.yellow.bold(
        'npm run webpack/yarn webpack',
      )} ? (Press Enter to continue.)`,
      validate: (value: string) =>
        value.trim() === '' || value.trim() === 'y' || value.trim() === 'yes' ? true : 'Press Enter to continue. Ctrl+C to exit.',
    });
  }
  if (mode == 'update-task') {
    await promptWithCancel({
      type: 'text',
      name: 'confirm',
      message: `Did you check if you have at least ${chalk.yellow.bold(
        '2 rounds of task bounty',
      )} in your current task? (Press Enter to continue.)`,
      validate: (value: string) =>
        value.trim() === '' || value.trim() === 'y' || value.trim() === 'yes' ? true : 'Press Enter to continue. Ctrl+C to exit.',
    });
  }
  if (mode == 'handle-assets') {
    await promptWithCancel({
      type: 'text',
      name: 'confirm',
      message: `Note: Direct IPFS loads currently do not support displaying Markdown files.`,
      validate: (value: string) =>
        value.trim() === '' || value.trim() === 'y' || value.trim() === 'yes' ? true : 'Press Enter to continue. Ctrl+C to exit.',
    });
  }
  switch (mode) {
    case 'create-repo': {
      // create two options; option one typescript option two javascript
      const repoZipUrl = await promptWithCancel({
        type: 'select',
        name: 'repoZipUrl',
        message: 'Please select the repository type',
        choices: [
          { title: 'Typescript (Recommended)', value: 'https://github.com/koii-network/task-template/archive/refs/heads/main.zip' },
          { title: 'Javascript', value: 'https://github.com/koii-network/task-template/archive/refs/heads/@javascript.zip' },
        ],
      });
      // create two options; option one typescript option two javascript
      await downloadRepo(repoZipUrl.repoZipUrl);
      break;
    }

    case 'create-task': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      const taskMode = (
        await promptWithCancel({
          type: 'select',
          name: 'mode',
          message:
            'How would you like to configure the task?',

          choices: [
            { title: 'using config-task.yml File (Recommended)', value: 'create-task-yml' },
            { title: 'using the CLI', value: 'create-task-cli' },
          ],
        })
      ).mode;
      console.log(taskMode);

      let task_name,
        task_audit_program_id,
        total_bounty_amount,
        bounty_amount_per_round,
        space,
        task_description,
        task_executable_network,
        round_time,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        allowed_failed_distributions,
        task_type,
        token_type;

      switch (taskMode) {
        case 'create-task-cli': {
          ({
            task_name,
            task_audit_program_id,
            total_bounty_amount,
            bounty_amount_per_round,
            space,
            task_description,
            task_executable_network,
            round_time,
            audit_window,
            submission_window,
            minimum_stake_amount,
            task_metadata,
            allowed_failed_distributions,
            task_type,
            token_type,
          } = await takeInputForCreateTask(connection, payerWallet, true));

          if (task_type == 'KPL') {
            

            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                space * 1000000,
              )) + 10000;

            const response = (
              await promptWithCancel({
                type: 'confirm',
                initial: true,
                name: 'response',
                message: `Your account will be charged a rent-exemption fee of ${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII and a bounty fee of ${total_bounty_amount} tokens.`,
              })
            ).response;
            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < minimumBalanceForRentExemption) {
              console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
              console.log(chalk.yellow('To continue, you need:'));
              console.log(`  • Minimum ${chalk.cyan(minimumBalanceForRentExemption / LAMPORTS_PER_SOL)} KOII for rent exemption\n`);
              
              console.log(chalk.yellow('You can get KOII in several ways:'));
              console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
              console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
              
              console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
              console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
              console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
              console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);

              await recheckBalance(connection, payerWallet, minimumBalanceForRentExemption);
            }

            const token_balance = await getTokenBalance(connection as unknown as SolanaConnection, payerWallet as unknown as SolanaKeypair, token_type);
            if (token_balance < total_bounty_amount) {
              console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
              console.log(chalk.yellow('To continue, you need:'));
              console.log(`  • Minimum ${chalk.cyan(total_bounty_amount / LAMPORTS_PER_SOL)} KOII for bounty amount\n`);
              
              console.log(chalk.yellow('You can get KOII in several ways:'));
              console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
              console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
              
              console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
              console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
              console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
              console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);

              await recheckBalance(connection, payerWallet, total_bounty_amount);
            }
            console.log('Calling Create Task');
            const { taskStateInfoKeypair, stake_pot_account_pubkey } =
              await KPLCreateTask(
                payerWallet as unknown as SolanaKeypair,
                task_name,
                task_audit_program_id,
                total_bounty_amount,
                bounty_amount_per_round,
                space * 1000000,
                task_description?.substring(0, 50),
                task_executable_network,
                round_time,
                audit_window,
                submission_window,
                minimum_stake_amount,
                task_metadata,
                '',
                '',
                allowed_failed_distributions,
                token_type,
              );
            fs.writeFileSync(
              'taskStateInfoKeypair.json',
              JSON.stringify(Array.from(taskStateInfoKeypair.secretKey)),
            );
            console.log('Task ID:', taskStateInfoKeypair.publicKey.toString());
            // console.log(
            //   'Stake Pot Account Pubkey:',
            //   stake_pot_account_pubkey.toBase58(),
            // );
          } else {
            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                space * 1000000,
              )) + 10000;
            const totalAmount =
              LAMPORTS_PER_SOL * total_bounty_amount +
              minimumBalanceForRentExemption;
            const response = (
              await promptWithCancel({
                type: 'confirm',
                name: 'response',
                initial: true,
                message: `Your account will be charged ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for creating the task, which includes the rent exemption(${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and bounty amount fees (${total_bounty_amount} KOII)`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
              console.log(chalk.yellow('To continue, you need:'));
              console.log(`  • Minimum ${chalk.cyan(totalAmount / LAMPORTS_PER_SOL)} KOII\n`);
              
              console.log(chalk.yellow('You can get KOII in several ways:'));
              console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
              console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
              
              console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
              console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
              console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
              console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);

              await recheckBalance(connection, payerWallet, totalAmount);
            }
            console.log('Calling Create Task');
            // TODO: All params for the createTask should be accepted from cli input and should be replaced in the function below
            const { taskStateInfoKeypair, stake_pot_account_pubkey } =
              await createTask(
                payerWallet,
                task_name,
                task_audit_program_id,
                total_bounty_amount,
                bounty_amount_per_round,
                space * 1000000,
                task_description?.substring(0, 50),
                task_executable_network,
                round_time,
                audit_window,
                submission_window,
                minimum_stake_amount,
                task_metadata,
                '',
                '',
                allowed_failed_distributions,
              );
            fs.writeFileSync(
              'taskStateInfoKeypair.json',
              JSON.stringify(Array.from(taskStateInfoKeypair.secretKey)),
            );
            console.log('Task ID:', taskStateInfoKeypair.publicKey.toBase58());
            // console.log(
            //   'Stake Pot Account Pubkey:',
            //   stake_pot_account_pubkey.toBase58(),
            // );
          }
          break;
        }

        case 'create-task-yml': {
          let metaDataCid: string;
          let task_audit_program_id: string;
          let stakingWalletKeypair: Keypair;

          const ymlPath = await getYmlPath();

          await readYamlFile(ymlPath).then(async (data: any) => {
            if (data.markdownDescriptionPath) {
              try {
                const markdownDescription = fs.readFileSync(data.markdownDescriptionPath, 'utf-8');
                data.description = markdownDescription;
              } catch (error) {
                console.error('Failed to read markdown file:', error);
              }
            }
            const metaData: TaskMetadata = {
              author: data.author.trim(),
              description: data.description.trim(),
              repositoryUrl: data.repositoryUrl,
              createdAt: Date.now(),
              imageUrl: data.imageUrl,
              infoUrl: data.infoUrl,
              koiiOceanUrl: data.koiiOceanUrl,
              requirementsTags: data.requirementsTags,
              tags: data.tags,
              environment: data.environment
            };
            fs.writeFileSync('./metadata.json', JSON.stringify(metaData));
            
            if (data.task_executable_network == 'IPFS') {
              const ipfsMode = (
                await promptWithCancel({
                  type: 'select',
                  name: 'mode',
                  message: 'Select your IPFS preference:',

                  choices: [
                    { title: 'Use KOII Storage SDK (Recommended)', value: 'koii-storage' },
                    { title: 'Enter IPFS CID Manually', value: 'manual' },
                  ],
                })
              ).mode;
              if (ipfsMode == 'manual') {
                const { ipfsCid, ipfsData } = await manualEnterIPFSCIDs();
                task_audit_program_id = ipfsCid;
                metaDataCid = ipfsData || '';
              } else {
                const stakingWalletPath = await getStakingWalletPath(connection, payerWallet);
                const wallet = fs.readFileSync(stakingWalletPath, 'utf-8');
                stakingWalletKeypair = Keypair.fromSecretKey(
                  Uint8Array.from(JSON.parse(wallet)),
                );
                await validateEligibilityForIPFSUpload(stakingWalletKeypair.publicKey);
                // Upload a main.js file
                task_audit_program_id = await uploadExecutableFileToIpfs(
                  data.task_audit_program,
                  stakingWalletKeypair,
                );

                // Upload a metadata.json file
                try {
                  metaDataCid = await uploadMetaDataFileToIpfs(
                    './metadata.json',
                    stakingWalletKeypair,
                  );
                } catch (err) {
                  console.error('IPFS upload faileds');
                  process.exit();
                }
              }
            } else if (
              data.task_executable_network == 'ARWEAVE' ||
              data.task_executable_network == 'DEVELOPMENT'
            ) {
              task_audit_program_id = data.task_audit_program;
              metaDataCid = 'metadata.json';
            } else {
              console.error(
                'Please specify the correct task_executable_network in YML',
              );
              process.exit();
            }
            const TaskData: Task = {
              task_name: data.task_name.trim(),
              task_executable_network: data.task_executable_network,
              task_audit_program: data.task_audit_program,
              task_audit_program_id: task_audit_program_id,
              round_time: data.round_time,
              audit_window: data.audit_window,
              submission_window: data.submission_window,
              minimum_stake_amount: data.minimum_stake_amount,
              total_bounty_amount: data.total_bounty_amount,
              bounty_amount_per_round: data.bounty_amount_per_round,
              allowed_failed_distributions: data.allowed_failed_distributions,
              space: data.space,
              task_type: data.task_type,
              token_type: data.token_type,
            };

            await validateTaskInputs(metaData, TaskData);
            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                data.space * 1000000,
              )) + 10000;
            if (TaskData.task_type == 'KPL') {
              const response = (
                await promptWithCancel({
                  type: 'confirm',
                  name: 'response',
                  initial: true,
                  message: `Your account will be charged a rent-exemption fee of ${
                    minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                  } KOII and a bounty fee of ${data.total_bounty_amount} ${TaskData.token_type} Tokens.`,
                })
              ).response;
              if (!response) process.exit(0);
              const lamports = await connection.getBalance(
                payerWallet.publicKey,
              );
              if (lamports < minimumBalanceForRentExemption) {
                console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
                console.log(chalk.yellow('To continue, you need:'));
                console.log(`  • Minimum ${chalk.cyan(minimumBalanceForRentExemption / LAMPORTS_PER_SOL)} KOII for rent exemption\n`);
                
                console.log(chalk.yellow('You can get KOII in several ways:'));
                console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
                console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
                
                console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
                console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
                console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
                console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);
  
                await recheckBalance(connection, payerWallet, minimumBalanceForRentExemption);
              }

              const token_balance = await getTokenBalance(connection as unknown as SolanaConnection, payerWallet as unknown as SolanaKeypair, TaskData.token_type);
              if (token_balance < TaskData.total_bounty_amount) {
                console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
                console.log(chalk.yellow('To continue, you need:'));
                console.log(`  • Minimum ${chalk.cyan(TaskData.total_bounty_amount / LAMPORTS_PER_SOL)} KOII for bounty amount\n`);
                
                console.log(chalk.yellow('You can get KOII in several ways:'));
                console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
                console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
                
                console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
                console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
                console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
                console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);
  
                await recheckBalance(connection, payerWallet, minimumBalanceForRentExemption);
              }
              console.log('Calling Create Task');
              // Before passing it to createTask validate the inputs
              const { taskStateInfoKeypair, stake_pot_account_pubkey } =
                await KPLCreateTask(
                  payerWallet as unknown as SolanaKeypair,
                  TaskData.task_name,
                  task_audit_program_id,
                  TaskData.total_bounty_amount,
                  TaskData.bounty_amount_per_round,
                  TaskData.space * 1000000,
                  data?.description?.substring(0, 50),
                  TaskData.task_executable_network,
                  TaskData.round_time,
                  TaskData.audit_window,
                  TaskData.submission_window,
                  TaskData.minimum_stake_amount,
                  metaDataCid,
                  '',
                  '',
                  TaskData.allowed_failed_distributions,
                  TaskData.token_type,
                );

              fs.writeFileSync(
                'taskStateInfoKeypair.json',
                JSON.stringify(Array.from(taskStateInfoKeypair.secretKey)),
              );
              if (data.task_executable_network == 'DEVELOPMENT') {
                fs.renameSync(
                  'metadata.json',
                  `dist/${taskStateInfoKeypair.publicKey.toBase58()}.json`,
                );
              }
              console.log(
                'Task ID:',
                taskStateInfoKeypair.publicKey.toBase58(),
              );
              // console.log(
              //   'Stake Pot Account Pubkey:',
              //   stake_pot_account_pubkey.toBase58(),
              // );
            } else {
              const totalAmount =
                LAMPORTS_PER_SOL * data.total_bounty_amount +
                minimumBalanceForRentExemption;
              const response = (
                await promptWithCancel({
                  type: 'confirm',
                  name: 'response',
                  initial: true,
                  message: `Your account will be charged ${
                    totalAmount / LAMPORTS_PER_SOL
                  } KOII for creating the task, which includes the rent exemption(${
                    minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                  } KOII) and bounty amount fees (${
                    data.total_bounty_amount
                  } KOII)`,
                })
              ).response;

              if (!response) process.exit(0);
              const lamports = await connection.getBalance(
                payerWallet.publicKey,
              );
              if (lamports < totalAmount) {
                console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
                console.log(chalk.yellow('To continue, you need:'));
                console.log(`  • Minimum ${chalk.cyan(totalAmount / LAMPORTS_PER_SOL)} KOII\n`);
                
                console.log(chalk.yellow('You can get KOII in several ways:'));
                console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
                console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
                
                console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
                console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
                console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
                console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);
  
                await recheckBalance(connection, payerWallet, totalAmount);
              }

              console.log('Calling Create Task');
              // Before passing it to createTask validate the inputs
              const { taskStateInfoKeypair, stake_pot_account_pubkey } =
                await createTask(
                  payerWallet,
                  TaskData.task_name,
                  task_audit_program_id,
                  TaskData.total_bounty_amount,
                  TaskData.bounty_amount_per_round,
                  TaskData.space * 1000000,
                  data?.description?.substring(0, 50),
                  TaskData.task_executable_network,
                  TaskData.round_time,
                  TaskData.audit_window,
                  TaskData.submission_window,
                  TaskData.minimum_stake_amount,
                  metaDataCid,
                  '',
                  '',
                  TaskData.allowed_failed_distributions,
                );
              fs.writeFileSync(
                'taskStateInfoKeypair.json',
                JSON.stringify(Array.from(taskStateInfoKeypair.secretKey)),
              );
              if (data.task_executable_network == 'DEVELOPMENT') {
                fs.renameSync(
                  'metadata.json',
                  `dist/${taskStateInfoKeypair.publicKey.toBase58()}.json`,
                );
              }
              console.log(
                'Task ID:',
                taskStateInfoKeypair.publicKey.toBase58(),
              );
              // console.log(
              //   'Stake Pot Account Pubkey:',
              //   stake_pot_account_pubkey.toBase58(),
              // );
            }
          });

          break;
        }
      }
      break;
    }
    case 'set-active': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;

      console.log('Calling SetActive');
      const { isActive, taskStateInfoAddress } = await takeInputForSetActive();
      const accountInfo = await connection.getAccountInfo(new PublicKey(taskStateInfoAddress.toBase58()));
      const IsKPLTask = await checkIsKPLTask(accountInfo);
      if (IsKPLTask) {
        await KPLSetActive(
          payerWallet as unknown as SolanaKeypair,
          taskStateInfoAddress as unknown as SolanaPublicKey,
          isActive,
        );
      } else {
        await SetActive(payerWallet, taskStateInfoAddress, isActive);
      }
      break;
    }
    case 'claim-reward': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;

      console.log('Calling ClaimReward');
      const { claimerWalletPath, beneficiaryAccount, taskStateInfoAddress } =
        await takeInputForClaimReward();
        const accountInfo = await connection.getAccountInfo(new PublicKey(taskStateInfoAddress.toBase58()));
        const IsKPLTask = await checkIsKPLTask(accountInfo);
      const taskStateJSON = await getTaskStateInfo(
        connection,
        taskStateInfoAddress.toBase58(),
      );
      const stake_pot_account = new PublicKey(taskStateJSON.stake_pot_account);
      console.log('Stake Pot Account', stake_pot_account.toString());
      if (IsKPLTask) {
        // Create the PublicKey
        const token_type = new PublicKey(taskStateJSON.token_type);
        await KPLClaimReward(
          payerWallet as unknown as SolanaKeypair,
          taskStateInfoAddress as unknown as SolanaPublicKey,
          stake_pot_account as unknown as SolanaPublicKey,
          beneficiaryAccount as unknown as SolanaPublicKey,
          claimerWalletPath,
          token_type.toBase58(),
        );
      } else {
        await ClaimReward(
          payerWallet,
          taskStateInfoAddress,
          stake_pot_account,
          beneficiaryAccount,
          claimerWalletPath,
        );
      }
      break;
    }
    case 'fund-task': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      console.log('Calling FundTask');

      const { taskStateInfoAddress, amount } = await takeInputForFundTask();
      const accountInfo = await connection.getAccountInfo(new PublicKey(taskStateInfoAddress.toBase58()));
      const IsKPLTask = await checkIsKPLTask(accountInfo);

      const taskStateJSON = await getTaskStateInfo(
        connection,
        taskStateInfoAddress.toBase58(),
      );
      const stakePotAccount = new PublicKey(taskStateJSON.stake_pot_account);
      if (IsKPLTask) {


        // Create the PublicKey
        const mint_publicKey = new PublicKey(taskStateJSON.token_type);

        console.log(`Funding your task with ${mint_publicKey} KPL Token.`);

        await KPLFundTask(
          payerWallet as unknown as SolanaKeypair,
          taskStateInfoAddress as unknown as SolanaPublicKey,
          stakePotAccount as unknown as SolanaPublicKey,
          amount,
          mint_publicKey.toBase58(),
        );
      } else {
        await FundTask(
          payerWallet,
          taskStateInfoAddress,
          stakePotAccount,
          amount,
        );
      }
      break;
    }
    case 'withdraw': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;

      console.log('Calling Withdraw');
      const { taskStateInfoAddress, submitterKeypair } =
        await takeInputForWithdraw();
      const accountInfo = await connection.getAccountInfo(new PublicKey(taskStateInfoAddress.toBase58()));
      const IsKPLTask = await checkIsKPLTask(accountInfo);
      if (IsKPLTask) {
        await KPLWithdraw(
          payerWallet as unknown as SolanaKeypair,
          taskStateInfoAddress as unknown as SolanaPublicKey,
          submitterKeypair as unknown as SolanaKeypair,
        );
      } else {
        await Withdraw(payerWallet, taskStateInfoAddress, submitterKeypair);
      }
      break;
    }
    case 'handle-assets': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      await handleMetadata();
      break;
    }
    case 'update-task': {
      const result = await initializeConnection();
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      const taskMode = (
        await promptWithCancel({
          type: 'select',
          name: 'mode',
          message: 'Select operation',

          choices: [
            { title: 'using config YML', value: 'yml' },
            { title: 'using CLI', value: 'cli' },
          ],
        })
      ).mode;
      console.log(taskMode);

      switch (taskMode) {
        case 'cli': {
          let taskId = (
            await promptWithCancel({
              type: 'text',
              name: 'taskId',
              message: 'Enter the task ID you want to update',
            })
          ).taskId;
          taskId = sanitizePath(taskId);
          const taskStateJSON = await getTaskStateInfo(
            connection,
            taskId
          );

          if (
            new PublicKey(taskStateJSON.task_manager).toString() !==
            payerWallet.publicKey.toString()
          ) {
            console.log('You are not the owner of this task! ');
            break;
          }
          const taskAccountInfoPubKey = new PublicKey(taskId);
          console.log('OLD TASK STATE INFO', taskAccountInfoPubKey);
          const statePotAccount = new PublicKey(
            taskStateJSON.stake_pot_account,
          );
          console.log('OLD STATE POT', statePotAccount);
          const {
            task_name,
            task_audit_program_id,
            bounty_amount_per_round,
            space,
            task_description,
            task_executable_network,
            round_time,
            audit_window,
            submission_window,
            minimum_stake_amount,
            task_metadata,
            allowed_failed_distributions,
            task_type,
            token_type,
          } = await takeInputForCreateTask(connection, payerWallet, false, taskStateJSON);
          // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
          if (task_type == 'KPL') {
            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                space * 1000000,
              )) + 10000;
            const totalAmount = minimumBalanceForRentExemption;
            const response = (
              await promptWithCancel({
                type: 'confirm',
                name: 'response',
                initial: true,
                message: `Your account will be charged ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for updating the task, which includes the rent exemption (${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and the bounty will be taken from the old task`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
              console.log(chalk.yellow('To continue, you need:'));
              console.log(`  • Minimum ${chalk.cyan(totalAmount / LAMPORTS_PER_SOL)} KOII\n`);
              
              console.log(chalk.yellow('You can get KOII in several ways:'));
              console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
              console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
              
              console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
              console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
              console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
              console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);

              await recheckBalance(connection, payerWallet, totalAmount);
            }
            const spinner = ora('Calling Update Task').start();

            const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
              await KPLUpdateTask(
                payerWallet as unknown as SolanaKeypair,
                task_name,
                task_audit_program_id,
                bounty_amount_per_round,
                space * 1000000,
                task_description,
                task_executable_network,
                round_time,
                audit_window,
                submission_window,
                minimum_stake_amount,
                task_metadata,
                '',
                allowed_failed_distributions,
                taskAccountInfoPubKey as unknown as SolanaPublicKey,
                statePotAccount as unknown as SolanaPublicKey,
                token_type,
              );
            fs.writeFileSync(
              'taskStateInfoKeypair.json',
              JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey)),
            );
            spinner.succeed('Update Task completed successfully');
            const data = [
              {
                Key: 'Task Id',
                Value: newTaskStateInfoKeypair.publicKey.toBase58(),
              },
              {
                Key: 'Stake Pot Account Pubkey',
                Value: newStake_pot_account_pubkey.toBase58(),
              },
            ];

            console.table(data);
          } else {
            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                space * 1000000,
              )) + 10000;
            const totalAmount = minimumBalanceForRentExemption;
            const response = (
              await promptWithCancel({
                type: 'confirm',
                name: 'response',
                initial: true,
                message: `Your account will be charged ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for updating the task, which includes the rent exemption (${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and the bounty will be taken from the old task`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
              console.log(chalk.yellow('To continue, you need:'));
              console.log(`  • Minimum ${chalk.cyan(totalAmount / LAMPORTS_PER_SOL)} KOII\n`);
              
              console.log(chalk.yellow('You can get KOII in several ways:'));
              console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
              console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
              
              console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
              console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
              console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
              console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);

              await recheckBalance(connection, payerWallet, totalAmount);
            }
            const spinner = ora('Calling Update Task').start();

            const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
              await updateTask(
                payerWallet,
                task_name,
                task_audit_program_id,
                bounty_amount_per_round,
                space * 1000000,
                task_description,
                task_executable_network,
                round_time,
                audit_window,
                submission_window,
                minimum_stake_amount,
                task_metadata,
                '',
                allowed_failed_distributions,
                taskAccountInfoPubKey,
                statePotAccount,
              );
            fs.writeFileSync(
              'taskStateInfoKeypair.json',
              JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey)),
            );
            spinner.succeed('Update Task completed successfully');
            const data = [
              {
                Key: 'Task Id',
                Value: newTaskStateInfoKeypair.publicKey.toBase58(),
              },
              {
                Key: 'Stake Pot Account Pubkey',
                Value: newStake_pot_account_pubkey.toBase58(),
              },
            ];

            console.table(data);
          }
          break;
        }

        case 'yml': {
          let metaDataCid: string;
          let task_audit_program_id_update: string;
          let stakingWalletKeypair: Keypair;

          const ymlPath = await getYmlPath();

          await readYamlFile(ymlPath).then(async (data: any) => {
            if (data.markdownDescriptionPath) {
              try {
                const markdownDescription = fs.readFileSync(data.markdownDescriptionPath, 'utf-8');
                data.description = markdownDescription;
              } catch (error) {
                console.error('Failed to read markdown file:', error);
              }
            }
            const metaData: TaskMetadata = {
              author: data.author.trim(),
              description: data.description.trim(),
              repositoryUrl: data.repositoryUrl,
              createdAt: Date.now(),
              migrationDescription: data.migrationDescription,
              imageUrl: data.imageUrl,
              infoUrl: data.infoUrl,
              koiiOceanUrl: data.koiiOceanUrl,
              requirementsTags: data.requirementsTags,
              tags: data.tags,
              environment: data.environment
            };
            fs.writeFileSync('./metadata.json', JSON.stringify(metaData));

            if (data.task_executable_network == 'IPFS') {
              const ipfsMode = (
                await promptWithCancel({
                  type: 'select',
                  name: 'mode',
                  message: 'Select operation',

                  choices: [
                    { title: 'Use KOII Storage SDK (Recommended)', value: 'koii-storage' },
                    { title: 'Enter IPFS CID Manually', value: 'manual' },
                  ],
                })
              ).mode;
              if (ipfsMode == 'manual') {
                const ipfsCid = (
                  await promptWithCancel({
                    type: 'text',
                    name: 'ipfsCid',
                    message: 'Enter the IPFS CID',
                  })
                ).ipfsCid.trim();
                task_audit_program_id_update = ipfsCid;
                const ipfsData = (
                  await promptWithCancel({
                    type: 'text',
                    name: 'metadataCid',
                    message: 'Enter the Metadata CID',
                  })
                ).metadataCid.trim();
                metaDataCid = ipfsData || '';
              } else {
                // ask user to enter the stakingWallet Keypair path
                const stakingWalletPath = await getStakingWalletPath(connection, payerWallet);
                const wallet = fs.readFileSync(stakingWalletPath, 'utf-8');
                stakingWalletKeypair = Keypair.fromSecretKey(
                  Uint8Array.from(JSON.parse(wallet)),
                );
                await validateEligibilityForIPFSUpload(stakingWalletKeypair.publicKey);
                // Upload a file
                task_audit_program_id_update = await uploadExecutableFileToIpfs(
                  data.task_audit_program,
                  stakingWalletKeypair,
                );

                // Upload a metadata.json file
                try {
                  metaDataCid = await uploadMetaDataFileToIpfs(
                    './metadata.json',
                    stakingWalletKeypair,
                  );
                } catch (err) {
                  console.error('IPFS upload faileds');
                  process.exit();
                }
              }
            } else if (
              data.task_executable_network == 'ARWEAVE' ||
              data.task_executable_network == 'DEVELOPMENT'
            ) {
              task_audit_program_id_update = data.task_audit_program;
              metaDataCid = 'metadata.json';
              process.exit();
            }

            const TaskData: UpdateTask = {
              task_id: data.task_id,
              task_name: data.task_name.trim(),
              task_executable_network: data.task_executable_network,
              task_audit_program: data.task_audit_program,
              task_audit_program_id: task_audit_program_id_update,
              round_time: data.round_time,
              audit_window: data.audit_window,
              submission_window: data.submission_window,
              minimum_stake_amount: data.minimum_stake_amount,
              bounty_amount_per_round: data.bounty_amount_per_round,
              allowed_failed_distributions: data.allowed_failed_distributions,
              space: data.space,
              task_type: data.task_type,
              token_type: data.token_type,
            };
            await validateUpdateTaskInputs(metaData, TaskData);
            console.log('Previous Task ID: ', TaskData.task_id);
            const taskStateJSON = await getTaskStateInfo(
              connection,
              TaskData.task_id,
            );
            //console.log(state);
            if (
              new PublicKey(taskStateJSON.task_manager).toString() !==
              payerWallet.publicKey.toString()
            ) {
              console.error('You are not the owner of this task! ');
              process.exit();
            }
            const taskAccountInfoPubKey = new PublicKey(TaskData.task_id);
            //console.log("OLD TASK STATE INFO", taskAccountInfoPubKey);
            const statePotAccount = new PublicKey(
              taskStateJSON.stake_pot_account,
            );
            //console.log("OLD STATE POT", statePotAccount);
            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                TaskData.space * 1000000,
              )) + 10000;
            const totalAmount = minimumBalanceForRentExemption;
            const response = (
              await promptWithCancel({
                type: 'confirm',
                name: 'response',
                initial: true,
                message: `Your account will be charged ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for updating the task, which includes the rent exemption (${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and the bounty will be taken from the old task`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.log(chalk.red('\n❌ Insufficient KOII balance for this operation\n'));
              console.log(chalk.yellow('To continue, you need:'));
              console.log(`  • Minimum ${chalk.cyan(totalAmount / LAMPORTS_PER_SOL)} KOII\n`);
              
              console.log(chalk.yellow('You can get KOII in several ways:'));
              console.log(`  1. ${chalk.green('Purchase directly')} with credit/debit card or Cash App Pay:`);
              console.log(`     ${chalk.cyan(`https://buy.koii.network/?pub=${payerWallet.publicKey.toBase58()}`)}\n`);
              
              console.log(`  2. ${chalk.green('Trade on exchanges')}:`);
              console.log(`     • Gate.io: ${chalk.cyan('https://www.gate.io/trade/KOII_USDT')}`);
              console.log(`     • MEXC: ${chalk.cyan('https://www.mexc.com/exchange/KOII_USDT')}`);
              console.log(`     • DEX support: ${chalk.gray('Coming soon!')}\n`);

              await recheckBalance(connection, payerWallet, totalAmount);
            }
            console.log('Calling Update Task');
            if (TaskData.task_type == 'KPL') {
              const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
                await KPLUpdateTask(
                  payerWallet as unknown as SolanaKeypair,
                  TaskData.task_name,
                  task_audit_program_id_update,
                  TaskData.bounty_amount_per_round,
                  TaskData.space * 1000000,
                  data?.description?.substring(0, 50),
                  TaskData.task_executable_network,
                  TaskData.round_time,
                  TaskData.audit_window,
                  TaskData.submission_window,
                  TaskData.minimum_stake_amount,
                  metaDataCid,
                  '',
                  TaskData.allowed_failed_distributions,
                  taskAccountInfoPubKey as unknown as SolanaPublicKey,
                  statePotAccount as unknown as SolanaPublicKey,
                  TaskData.token_type,
                );
              fs.writeFileSync(
                'taskStateInfoKeypair.json',
                JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey)),
              );
              if (data.task_executable_network == 'DEVELOPMENT') {
                fs.renameSync(
                  'metadata.json',
                  `dist/${newTaskStateInfoKeypair.publicKey.toBase58()}.json`,
                );
              }
              console.log(
                'Task ID:',
                newTaskStateInfoKeypair.publicKey.toBase58(),
              );
              // console.log(
              //   'Stake Pot Account Pubkey:',
              //   newStake_pot_account_pubkey.toBase58(),
              // );
            } else {
              const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
                await updateTask(
                  payerWallet,
                  TaskData.task_name,
                  task_audit_program_id_update,
                  TaskData.bounty_amount_per_round,
                  TaskData.space * 1000000,
                  data?.description?.substring(0, 50),
                  TaskData.task_executable_network,
                  TaskData.round_time,
                  TaskData.audit_window,
                  TaskData.submission_window,
                  TaskData.minimum_stake_amount,
                  metaDataCid,
                  '',
                  TaskData.allowed_failed_distributions,
                  taskAccountInfoPubKey,
                  statePotAccount,
                );
              fs.writeFileSync(
                'taskStateInfoKeypair.json',
                JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey)),
              );
              if (data.task_executable_network == 'DEVELOPMENT') {
                fs.renameSync(
                  'metadata.json',
                  `dist/${newTaskStateInfoKeypair.publicKey.toBase58()}.json`,
                );
              }
              console.log(
                'Task ID:',
                newTaskStateInfoKeypair.publicKey.toBase58(),
              );
              // console.log(
              //   'Stake Pot Account Pubkey:',
              //   newStake_pot_account_pubkey.toBase58(),
              // );
            }
          });
          break;
        }
      }
      break;
    }

    default:
      console.error('Invalid option selected');
  }
  console.log('Success');
}

async function takeInputForCreateTask(connection: Connection, payerWallet: Keypair, isBounty: boolean, state?: any) {
  let task_name = (
    await promptWithCancel({
      type: 'text',
      name: 'task_name',
      message: 'Enter the name of the task',
    })
  ).task_name.trim();
  while (task_name.length > 24) {
    console.error('The task name cannot be greater than 24 characters');
    task_name = (
      await promptWithCancel({
        type: 'text',
        name: 'task_name',
        message: 'Enter the name of the task',
        initial: state?.name || null,
      })
    ).task_name.trim();
  }
  const task_description = (
    await promptWithCancel({
      type: 'text',
      name: 'task_description',
      message: 'Enter a short description of your task',
    })
  ).task_description.trim();

  const task_executable_network = (
    await promptWithCancel({
      type: 'select',
      name: 'task_executable_network',
      message: 'Please select the type of network',
      choices: [
        {
          title: 'DEVELOPMENT',
          value: 'DEVELOPMENT',
        },
        {
          title: 'IPFS',
          value: 'IPFS',
        },
        {
          title: 'ARWEAVE',
          value: 'ARWEAVE',
        },
      ],
    })
  ).task_executable_network;

  let stakingWalletKeypair;
  let task_audit_program;
  let task_audit_program_id;
  if (task_executable_network == 'IPFS') {
    const stakingWalletPath = await getStakingWalletPath(connection, payerWallet);
    if (!fs.existsSync(stakingWalletPath)) {
      throw Error('Please make sure that the staking wallet path is correct');
    }
    const wallet = fs.readFileSync(stakingWalletPath, 'utf-8');
    stakingWalletKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(wallet)),
    );
    task_audit_program = (
      await promptWithCancel({
        type: 'text',
        name: 'task_audit_program',
        message: 'Enter the path to your executable webpack',
      })
    ).task_audit_program.trim();

    while (task_audit_program.length > 200) {
      console.error(
        'The task audit program length cannot be greater than 200 characters',
      );
      task_audit_program = (
        await promptWithCancel({
          type: 'text',
          name: 'task_audit_program',
          message: 'Enter the path to your executable webpack',
        })
      ).task_audit_program.trim();
    }
    task_audit_program_id = await uploadExecutableFileToIpfs(
      task_audit_program,
      stakingWalletKeypair,
    );
    while (task_audit_program_id == 'File not found') {
      task_audit_program = (
        await promptWithCancel({
          type: 'text',
          name: 'task_audit_program',
          message: 'Enter the path to your executable webpack',
        })
      ).task_audit_program.trim();
      task_audit_program_id = await uploadExecutableFileToIpfs(
        task_audit_program,
        stakingWalletKeypair,
      );
    }
  } else if (task_executable_network == 'ARWEAVE') {
    task_audit_program_id = (
      await promptWithCancel({
        type: 'text',
        name: 'task_audit_program_id',
        message:
          'Enter Arweave id of the deployed koii task executable program',
      })
    ).task_audit_program_id.trim();
    while (task_audit_program_id.length > 64) {
      console.error(
        'The task audit program length cannot be greater than 64 characters',
      );
      task_audit_program_id = (
        await promptWithCancel({
          type: 'text',
          name: 'task_audit_program_id',
          message:
            'Enter Arweave id of the deployed koii task executable program',
        })
      ).task_audit_program_id.trim();
    }
  } else {
    task_audit_program_id = (
      await promptWithCancel({
        type: 'text',
        name: 'task_audit_program_id',
        message: 'Enter the name of executable you want to run on  task-nodes',
      })
    ).task_audit_program_id.trim();
    while (task_audit_program_id.length > 64) {
      console.error(
        'The task audit program length cannot be greater than 64 characters',
      );
      task_audit_program_id = (
        await promptWithCancel({
          type: 'text',
          name: 'task_audit_program_id',
          message:
            'Enter the name of executable you want to run on  task-nodes',
        })
      ).task_audit_program_id.trim();
    }
  }
  const round_time = (
    await promptWithCancel({
      type: 'number',
      name: 'round_time',
      message: 'Enter the round time in slots',
    })
  ).round_time;
  const audit_window = (
    await promptWithCancel({
      type: 'number',
      name: 'audit_window',
      message: 'Enter the audit window in slots',
    })
  ).audit_window;
  const submission_window = (
    await promptWithCancel({
      type: 'number',
      name: 'submission_window',
      message: 'Enter the submission window in slots',
    })
  ).submission_window;
  const minimum_stake_amount = (
    await promptWithCancel({
      type: 'number',
      name: 'minimum_stake_amount',
      message: 'Enter the minimum staking amount for the task',
      float: true,
    })
  ).minimum_stake_amount;
  let total_bounty_amount;

  if (isBounty) {
    total_bounty_amount = (
      await promptWithCancel({
        type: 'number',
        name: 'total_bounty_amount',
        message:
          'Enter the total bounty you want to allocate for the task',
      })
    ).total_bounty_amount;
    while (total_bounty_amount < 10) {
      console.error('The total_bounty_amount cannot be less than 10');
      total_bounty_amount = (
        await promptWithCancel({
          type: 'number',
          name: 'total_bounty_amount',
          message:
            'Enter the total bounty you want to allocate for the task',
        })
      ).total_bounty_amount;
    }
  }
  let bounty_amount_per_round = (
    await promptWithCancel({
      type: 'number',
      name: 'bounty_amount_per_round',
      message: 'Enter the bounty amount per round',
      // max: total_bounty_amount,
    })
  ).bounty_amount_per_round;
  let allowed_failed_distributions = (
    await promptWithCancel({
      type: 'number',
      name: 'allowed_failed_distributions',
      message:
        'Enter the number of distribution list submission retry in case it fails',
    })
  ).allowed_failed_distributions;
  while (allowed_failed_distributions < 0) {
    console.error('failed distributions cannot be less than 0');
    allowed_failed_distributions = (
      await promptWithCancel({
        type: 'number',
        name: 'allowed_failed_distributions',
        message:
          'Enter the number of distribution list submission retry in case it fails',
      })
    ).allowed_failed_distributions;
  }

  const task_metadata = (
    await promptWithCancel({
      type: 'text',
      name: 'task_metadata',
      message: `Enter TaskMetadata CID hosted on ${'IPFS'} (Leave empty for None).`,
    })
  ).task_metadata.trim();
  if (isBounty) {
    while (bounty_amount_per_round > total_bounty_amount) {
      console.error(
        'The bounty_amount_per_round cannot be greater than total_bounty_amount',
      );
      bounty_amount_per_round = (
        await promptWithCancel({
          type: 'number',
          name: 'bounty_amount_per_round',
          message: 'Enter the bounty amount per round',
        })
      ).bounty_amount_per_round;
    }
  }

  let space = (
    await promptWithCancel({
      type: 'number',
      name: 'space',
      message:
        'Enter the space, you want to allocate for task account (in MBs)',
    })
  ).space;
  while (space < 0.1 || space > 50) {
    console.error('Space must be between 0.1 MB and 50 MB');
    space = (
      await promptWithCancel({
        type: 'number',
        name: 'space',
        message:
          'Enter the space, you want to allocate for task account (in MBs)',
      })
    ).space;
  }

  const task_type = (
    await promptWithCancel({
      type: 'select',
      name: 'task_type',
      message: 'Please select the type of task:',

      choices: [
        { title: 'KOII-Task', value: 'KOII' },
        { title: 'KPL-Task', value: 'KPL' },
      ],
    })
  ).task_type;

  const token_type = (
    await promptWithCancel({
      type: 'text',
      name: 'token_type',
      message: `Please input token type for KPL Task. Leave it blank if it is KOII Task. `,
    })
  ).token_type.trim();

  return {
    task_name,
    task_audit_program_id,
    total_bounty_amount,
    bounty_amount_per_round,
    space,
    task_description,
    task_executable_network,
    round_time,
    audit_window,
    submission_window,
    minimum_stake_amount,
    task_metadata,
    allowed_failed_distributions,
    task_type,
    token_type,
  };
}

async function takeInputForSetActive() {
  const taskStateInfoAddress = (
    await promptWithCancel({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the Task ID',
    })
  ).taskStateInfoAddress.trim();
  const isActive = (
    await promptWithCancel({
      type: 'select',
      name: 'isActive',
      message: 'Do you want to set the task to Active or Inactive?',
      choices: [
        {
          title: 'Active',
          description: 'Set the task active',
          value: 'Active',
        },
        {
          title: 'Inactive',
          description: 'Deactivate the task',
          value: 'Inactive',
        },
      ],
    })
  ).isActive;
  return {
    isActive: isActive == 'Active',
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}

async function takeInputForClaimReward() {
  const taskStateInfoAddress = (
    await promptWithCancel({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the Task ID',
    })
  ).taskStateInfoAddress.trim();
  const beneficiaryAccount = (
    await promptWithCancel({
      type: 'text',
      name: 'beneficiaryAccount',
      message:
        'Enter the beneficiaryAccount address (Address that the funds will be transferred to)',
    })
  ).beneficiaryAccount.trim();
  const claimerWalletPath = await getClaimerWalletPath();
  return {
    claimerWalletPath,
    beneficiaryAccount: new PublicKey(beneficiaryAccount),
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForFundTask() {
  const taskStateInfoAddress = (
    await promptWithCancel({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the Task ID',
    })
  ).taskStateInfoAddress.trim();
  const amount = (
    await promptWithCancel({
      type: 'text',
      name: 'amount',
      message: 'Enter the amount to fund',
    })
  ).amount.trim();
  return {
    amount: amount,
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForWithdraw() {
  const taskStateInfoAddress = (
    await promptWithCancel({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the Task ID',
    })
  ).taskStateInfoAddress.trim();
  const submitterWalletPath = await getSubmitterWalletPath();
  const wallet = fs.readFileSync(submitterWalletPath, 'utf-8');
  const submitterKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(wallet)),
  );
  return {
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
    submitterKeypair,
  };
}

async function recheckBalance(connection: Connection, wallet: Keypair, requiredBalance: number) {
  let currentBalance;
  do {
    const recheck = await promptWithCancel({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { title: 'Re-check balance', value: 'recheck' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    if (recheck.action === 'exit') {
      process.exit(0);
    }

    currentBalance = await connection.getBalance(wallet.publicKey);
    if (currentBalance >= requiredBalance) {
      console.log(chalk.green('\n✓ Sufficient balance detected! Continuing...\n'));
      return;
    }

    console.log(chalk.red(`\n❌ Balance still insufficient: ${currentBalance / LAMPORTS_PER_SOL} KOII\n`));
  // eslint-disable-next-line no-constant-condition
  } while (true);
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  },
);
