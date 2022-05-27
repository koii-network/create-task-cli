/**
 * Hello world
 */

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  submitTask,
  SetTaskToVoting,
  Vote,
  Whitelist,
  SetActive,
  Payout,
  ClaimReward,
  FundTask,
} from './task_contract';
import prompts from 'prompts';
import { PublicKey } from '@solana/web3.js';

async function main() {
  if (!process.env.wallet) {
    console.error('No wallet found');

    const walletPath = (
      await prompts({
        type: 'text',
        name: 'wallet',
        message: 'Enter the path to your wallet',
      })
    ).wallet;
    console.log(walletPath);
  }

  const mode = (
    await prompts({
      type: 'select',
      name: 'mode',
      message: 'Select operation',

      choices: [
        {title: 'Create a new task', value: 'create-task'},
        {title: 'Set task to voting', value: 'set-task-to-voting'},
        {title: 'Whitelist the task', value: 'whitelisting'},
        {title: 'Mark task as active', value: 'set-active'},
        {title: 'Trigger payout', value: 'payout'},
        {title: 'Claim reward', value: 'claim-reward'},
        {title: 'Fund task with more KOII', value: 'fund-task'},
      ],
    })
  ).mode;
  console.log(mode);
  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Check if the program has been deployed
  await checkProgram();

  switch (mode) {
    case 'create-task':
      console.log('CALLING CREATE TASK');
      let taskStateInfoKeypair = await createTask();
      console.log('TASK STATE INFO KEY:', taskStateInfoKeypair.publicKey.toBase58());

    case 'set-task-to-voting':
      const {taskStateInfoAddress} = await takeInputForSetTaskToVoting()
      await SetTaskToVoting(taskStateInfoAddress);
      console.log('CALLING SetTaskToVoting');
    case 'whitelisting':
      console.log('CALLING Whitelist');
      await Whitelist(taskStateInfoKeypair);
    case 'set-active':
      console.log('CALLING SetActive');
      await SetActive(taskStateInfoKeypair);
    case 'payout':
      console.log('CALLING Payout');
      await Payout(taskStateInfoKeypair);
    case 'claim-reward':
      console.log('CALLING ClaimReward');
      await ClaimReward(taskStateInfoKeypair);
    case 'fund-task':
      console.log('CALLING FundTask');
      await FundTask(taskStateInfoKeypair);
    default:
      console.error('Invalid option selected');
  }
  console.log('Success');
}

async function takeInputForSetTaskToVoting(){
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}
main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
