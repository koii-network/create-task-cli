import fs from 'fs';
import { Connection, Keypair, PublicKey } from '@_koii/web3.js';
import { KoiiStorageClient } from '@_koii/storage-task-sdk';
import ora from 'ora';
import chalk from 'chalk';
import { promptWithCancel } from './prompts';
import * as dotenv from 'dotenv';

dotenv.config();

export async function uploadExecutableFileToIpfs(
  filePath: string,
  stakingWalletKeypair: Keypair,
): Promise<string> {
  const spinner = ora('Processing file...').start();

  try {
    if (filePath.substring(filePath.length - 7) !== 'main.js') {
      spinner.fail(
        chalk.red("Provide a valid path to webpacked 'main.js' file"),
      );
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      spinner.fail(chalk.red('Task audit program file not found'));
      console.info('💡 Tip: Make sure to:');
      console.info('   • Run: yarn webpack');
      console.info(
        "   • Verify: 'task_audit_program' path in your config-task.yml is correct",
      );
      process.exit(1);
    }

    spinner.text = 'Uploading file to IPFS...';

    const storageClient = KoiiStorageClient.getInstance({});
    let cid: any;

    if (storageClient) {
      const ipfsData = await storageClient.uploadFile(
        filePath,
        stakingWalletKeypair,
      );
      cid = ipfsData.cid;
      spinner.succeed(chalk.green(`CID of Executable: ${cid}`));
    } else {
      console.error('Storage client not initialized');
      process.exit(1);
    }
    console.log(
      `You can access https://ipfs-gateway.koii.live/ipfs/${cid}/main.js to check your executables.`,
    );
    return cid;
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}
export async function uploadMetaDataFileToIpfs(
  filePath: string,
  stakingWalletKeypair: Keypair,
): Promise<string> {
  const spinner = ora('Processing file...').start();

  try {
    if (filePath.substring(filePath.length - 13) !== 'metadata.json') {
      spinner.fail(chalk.red('Provide a valid path to metadata file'));
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      spinner.fail(chalk.red('Task metadata file not found'));
      process.exit(1);
    }

    spinner.text = 'Uploading file to IPFS...';

    const storageClient = KoiiStorageClient.getInstance({});
    let cid: any;

    if (storageClient) {
      const ipfsData = await storageClient.uploadFile(
        filePath,
        stakingWalletKeypair,
      );
      cid = ipfsData.cid;
      spinner.succeed(chalk.green(`CID of Metadata: ${cid}`));
    } else {
      console.error('Storage client not initialized');
      process.exit(1);
    }

    console.log(
      `You can access https://ipfs-gateway.koii.live/ipfs/${cid}/metadata.json to check your metadata.`,
    );
    return cid;
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

export async function manualEnterIPFSCIDs() {
  const ipfsCid = (
    await promptWithCancel({
      type: 'text',
      name: 'ipfsCid',
      message: 'Enter the IPFS CID',
    })
  ).ipfsCid.trim();

  const ipfsData = (
    await promptWithCancel({
      type: 'text',
      name: 'metadataCid',
      message: 'Enter the Metadata CID',
    })
  ).metadataCid.trim();
  if ((await isValidCID(ipfsCid)) && (await isValidCID(ipfsData))) {
    return { ipfsCid, ipfsData };
  } else {
    console.error(chalk.red('The CID format is not correct.'));
    process.exit();
  }
}

async function isValidCID(cid: string) {
  try {
    return true;
  } catch (error) {
    return false;
  }
}

export async function validateEligibilityForIPFSUpload(
  stakingWalletPubkey: PublicKey,
) {
  // check if the staking wallet key is owned by ""
  const endpoints = [
    'https://testnet.koii.network',
    'https://mainnet.koii.network',
  ];
  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint, 'confirmed');
      const account = await connection.getAccountInfo(stakingWalletPubkey);
      if (
        account?.owner.toBase58() ==
          'Koiitask22222222222222222222222222222222222' ||
        account?.owner.toBase58() ==
          'KPLTRVs6jA7QTthuJH2cEmyCEskFbSV2xpZw46cganN'
      ) {
        return true;
      }
    } catch (error) {
      console.log('Attempting to connect to the next endpoint...');
    }
  }
  console.log(chalk.red.bold('Staking Wallet Status:'));
  console.log(
    chalk.red(
      'This is either not a staking wallet or it has lost its staking status due to low rent.',
    ),
  );
  console.log(
    chalk.yellow(
      'Please run a task on your node to initialize your staking wallet again.',
    ),
  );
  process.exit(1);
}
