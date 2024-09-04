import fs from 'fs';
import { Keypair } from '@_koii/web3.js';
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
      throw new Error('Storage client not initialized');
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
      throw new Error('Storage client not initialized');
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
