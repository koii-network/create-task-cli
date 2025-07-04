/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import os from 'os';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { Keypair, PublicKey } from '@_koii/web3.js';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * @private
 */
export async function getConfig(): Promise<any> {
  // Path to KOII CLI config file
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'koii',
    'cli',
    'config.yml',
  );

  const configYml = fs.readFileSync(CONFIG_FILE_PATH, { encoding: 'utf8' });

  return yaml.parse(configYml);
}
export function prettyPrintConfig(config: any) {
  console.log(
    'RPC Connected: ',
    chalk.green.bold(config.json_rpc_url),
  );
  if (!config.json_rpc_url.includes('https://testnet.koii.network') && !config.json_rpc_url.includes('https://mainnet.koii.network')) {
    console.log(chalk.red("You are not using the recommended network!"));
    console.log(chalk.blue("Run ") + chalk.green("koii config set --url testnet") + chalk.blue(" to use testnet"));
  }

}
/**
 * Load and parse the Koii CLI config file to determine which RPC url to use
 */
export async function getRpcUrl(): Promise<string> {
  try {
    const config = await getConfig();
    prettyPrintConfig(config);
    if (!config.json_rpc_url) throw new Error('Missing RPC URL');
    return config.json_rpc_url;
  } catch (err) {
    console.warn(
      '⚠️  Could not read RPC URL from KOII CLI config. Falling back to testnet.'
    );
    console.info(
      '💡 Tip: For a smoother setup, consider installing the KOII CLI: https://www.koii.network/docs/develop/category/koii-command-line-tool'
    );
    return 'https://testnet.koii.network/';
  }
}

/**
 * Load and parse the KOII CLI config file to determine which payer to use
 */
export async function getPayer(): Promise<Keypair> {
  try {
    const config = await getConfig();
    if (!config.keypair_path) throw new Error('Missing keypair path');
    return await createKeypairFromFile(config.keypair_path);
  } catch (err) {
    console.warn(
      'Failed to create keypair from CLI config file, falling back to new random keypair',
    );
    return Keypair.generate();
  }
}

/**
 * Create a Keypair from a secret key stored in file as bytes' array
 */
export async function createKeypairFromFile(
  filePath: string,
): Promise<Keypair> {
  const secretKeyString = fs.readFileSync(filePath, { encoding: 'utf8' });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export async function parseKoiiTaskStateInfo(taskState: any) {
  const taskStateJSON = JSON.parse(taskState.data.toString());
  taskStateJSON.task_manager = new PublicKey(taskStateJSON.task_manager).toBase58();
  taskStateJSON.stake_pot_account = new PublicKey(taskStateJSON.stake_pot_account).toBase58();
  Object.keys(taskStateJSON['distribution_rewards_submission']).forEach(key => {
    const userObject = taskStateJSON['distribution_rewards_submission'][key];
    Object.keys(userObject).forEach(userKey => {
      if (userObject[userKey].submission_value) {
        userObject[userKey].submission_value = new PublicKey(userObject[userKey].submission_value).toBase58();
      }
    });
  });
  return taskStateJSON
}