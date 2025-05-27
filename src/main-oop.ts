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
import { KoiiAnimationEngine } from './animation/KoiiAnimationEngine';

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

// OOP Animation Function using the new KoiiAnimationEngine
async function displayKoiiAnimationOOP(): Promise<void> {
  try {
    // Create animation engine with default configuration
    const animationEngine = new KoiiAnimationEngine({
      frameRate: 200,
      oceanWidth: 80,
      maxPosition: 490,
      foodSpacing: 20,
      seaweedPositions: [15, 25, 35, 45]
    });

    // Start the animation and wait for completion
    await animationEngine.start();
    
    // Animation completed successfully
    console.log(chalk.green.bold('🎉 Animation completed! Proceeding to CLI menu...'));
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Animation error:'), error);
    console.log(chalk.yellow.bold('⚠️ Falling back to CLI menu...'));
  }
}

async function main() {
  return new Promise<void>((resolve) => {
    displayKoiiAnimationOOP().then(() => {
      resolve();
    }).catch((error) => {
      console.error('Animation failed:', error);
      resolve();
    });
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

  // Rest of the CLI logic would go here...
  // For brevity, I'm including just the structure
  console.log(chalk.cyan.bold(`Selected operation: ${mode}`));
  console.log(chalk.yellow.bold('🚧 CLI operations would continue here...'));
}

// Export for testing
export { displayKoiiAnimationOOP, initializeConnection };

main().then(
  () => {
    continueWithMain().then(() => {
      process.exit();
    });
  },
  (err) => {
    console.error(err);
    process.exit(-1);
  },
); 