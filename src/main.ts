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
import { Keypair, PublicKey } from '@solana/web3.js';
import { fs } from 'mz';

async function main() {
  let payerWallet:Keypair;
  let walletPath:string = process.env.wallet || "";
  if (!process.env.wallet) {
    console.error('No wallet found');
    walletPath = (
      await prompts({
        type: 'text',
        name: 'wallet',
        message: 'Enter the path to your wallet',
      })
    ).wallet;
    console.log(walletPath);
    if(!fs.existsSync(walletPath))throw Error("Invalid Wallet Path")
  }
  try {
    let wallet = fs.readFileSync(walletPath,"utf-8"); 
    payerWallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(wallet)),
    );
  } catch (e) {
    console.error("Wallet Doesn't Exist");
    process.exit()
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
      console.log('Calling Create Task');
      let taskStateInfoKeypair = await createTask();
      console.log('TASK STATE INFO KEY:', taskStateInfoKeypair.publicKey.toBase58());
    case 'set-task-to-voting':
      {
        const {taskStateInfoAddress, deadline} = await takeInputForSetTaskToVoting()
        console.log('Calling SetTaskToVoting');
        await SetTaskToVoting(payerWallet,taskStateInfoAddress, deadline);
      }
    case 'whitelisting':
      {
        const {taskStateInfoAddress} = await takeInputForWhitelisting()
        console.log('Calling Whitelist');
        await Whitelist(payerWallet, taskStateInfoAddress);
      }
    case 'set-active':
      {
        console.log('Calling SetActive');
        const {taskStateInfoAddress} = await takeInputForSetActive()
        await SetActive(payerWallet,taskStateInfoAddress);
      }
    case 'payout':
      {
        console.log('Calling Payout');
        const {taskStateInfoAddress} = await takeInputForPayout()
        await Payout(payerWallet,taskStateInfoAddress);
      }
    case 'claim-reward':
      {  
        console.log('Calling ClaimReward');
        const {taskStateInfoAddress} = await takeInputForClaimReward()
        await ClaimReward(payerWallet,taskStateInfoAddress);
      }
    case 'fund-task':
      console.log('Calling FundTask');
      const {taskStateInfoAddress} = await takeInputForFundTask()
      await FundTask(payerWallet,taskStateInfoAddress);
    default:
      console.error('Invalid option selected');
  }
  console.log('Success');
}

async function takeInputForCreateTask(){
  // const taskStateInfoAddress = (
  //   await prompts({
  //     type: 'text',
  //     name: 'taskStateInfoAddress',
  //     message: 'Enter the path to your wallet',
  //   })
  // ).taskStateInfoAddress;
  // return {taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}

async function takeInputForSetTaskToVoting(){
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  const deadline = (
    await prompts({
      type: 'number',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {deadline,taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}
async function takeInputForWhitelisting(){
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}
async function takeInputForSetActive(){
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}
async function takeInputForPayout(){
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}
async function takeInputForClaimReward(){
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress:new PublicKey(taskStateInfoAddress)}
}
async function takeInputForFundTask(){
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
