/**
 * Hello world
 */

import fs from 'fs';
import { config } from 'dotenv';
import { tmpdir } from 'os';
import { promptWithCancel } from './prompts';
import { join } from 'path';
import { Keypair } from '@_koii/web3.js';
import { uploadMetaDataFileToIpfs } from './ipfs';

config();
let stakingWalletKeypair: Keypair;

async function takeInputForRequirementTypes() {
  const value = (
    await promptWithCancel({
      type: 'text',
      name: 'value',
      message: 'Enter the value',
    })
  ).value;

  const description = (
    await promptWithCancel({
      type: 'text',
      name: 'description',
      message: 'Enter the description',
    })
  ).description;

  return { value, description };
}

async function main() {
  // ask user to enter the stakingWallet Keypair path
  const stakingWalletPath = (
    await promptWithCancel({
      type: 'text',
      name: 'stakingWalletPath',
      message: 'Enter the path to your staking wallet',
    })
  ).stakingWalletPath;
  if (!fs.existsSync(stakingWalletPath)) {
    throw Error('Please make sure that the staking wallet path is correct');
  }
  const wallet = fs.readFileSync(stakingWalletPath, 'utf-8');
  stakingWalletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(wallet)),
  );
  await takeInputForMetadata();
}

async function takeInputForMetadata() {
  const metadata: any = {
    author: '',
    description: '',
    repositoryUrl: '',
    createdAt: '',
    imageURL: '',
    requirementsTags: [],
  };

  metadata.author = (
    await promptWithCancel({
      type: 'text',
      name: 'author',
      message: 'Enter the name of the task Author',
    })
  ).author;
  metadata.description = (
    await promptWithCancel({
      type: 'text',
      name: 'description',
      message: 'Enter the task description',
    })
  ).description;
  metadata.repositoryUrl = (
    await promptWithCancel({
      type: 'text',
      name: 'repositoryUrl',
      message: 'Enter the task repository URL',
    })
  ).repositoryUrl;
  metadata.imageURL = (
    await promptWithCancel({
      type: 'text',
      name: 'imageURL',
      message: 'Enter the task Image URL',
    })
  ).imageURL;

  let response = (
    await promptWithCancel({
      type: 'confirm',
      name: 'response',
      message: `Do you wish to add other requirement types`,
    })
  ).response;

  while (response) {
    const mode = (
      await promptWithCancel({
        type: 'select',
        name: 'mode',
        message: 'Select field',

        choices: [
          { title: 'GLOBAL_VARIABLE', value: 'global-varibale' },
          { title: 'TASK_VARIABLE', value: 'task-variable' },
          { title: 'CPU', value: 'cpu' },
          { title: 'RAM', value: 'ram' },
          { title: 'STORAGE', value: 'storage' },
          { title: 'NETWORK', value: 'network' },
          { title: 'ARCHITECTURE', value: 'architecture' },
          { title: 'OS', value: 'os' },
        ],
      })
    ).mode;
    console.log(mode);

    const { value, description } = await takeInputForRequirementTypes();
    const requirementTag = {
      type: mode,
      value: value,
      description: description,
    };
    metadata.requirementsTags.push(requirementTag);

    response = (
      await promptWithCancel({
        type: 'confirm',
        name: 'response',
        message: `Do you wish to add other requirement types`,
      })
    ).response;
  }

  console.log(metadata);
  const tmp = tmpdir();
  const metadataPath = join(tmp, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  // const storageClient = new Web3Storage({ token: web3Key as string });

  // const upload: any = await getFilesFromPath([metadataPath]);
  // const result = await storageClient.put(upload);
  const IPFSCID = await uploadMetaDataFileToIpfs(
    metadataPath,
    stakingWalletKeypair,
  );
  console.log(
    '\x1b[1m\x1b[32m%s\x1b[0m',
    `Your MetaData CID is ${IPFSCID}/metadata.json`,
  );
}

export default main;
