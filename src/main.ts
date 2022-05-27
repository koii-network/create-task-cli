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
import {Keypair, PublicKey} from '@solana/web3.js';
import {fs} from 'mz';

async function main() {
  let payerWallet: Keypair;
  let walletPath: string = process.env.wallet || '';
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
    if (!fs.existsSync(walletPath)) throw Error('Invalid Wallet Path');
  }
  try {
    let wallet = fs.readFileSync(walletPath, 'utf-8');
    payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet)));
  } catch (e) {
    console.error("Wallet Doesn't Exist");
    process.exit();
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
  const connection = await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Check if the program has been deployed
  await checkProgram();

  switch (mode) {
    case 'create-task':
      const {task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, deadline, space} =
        await takeInputForCreateTask();
      let totalAmount =
        total_bounty_amount +
        (await connection.getMinimumBalanceForRentExemption(100)) +
        10000 +
        (await connection.getMinimumBalanceForRentExemption(space)) +
        10000;
      console.log('Calling Create Task');
      let taskStateInfoKeypair = await createTask(
        task_name,
        task_audit_program,
        total_bounty_amount,
        bounty_amount_per_round,
        deadline,
        space
      );
      console.log('TASK STATE INFO KEY:', taskStateInfoKeypair.publicKey.toBase58());
    case 'set-task-to-voting': {
      const {taskStateInfoAddress, deadline} = await takeInputForSetTaskToVoting();
      console.log('Calling SetTaskToVoting');
      await SetTaskToVoting(payerWallet, taskStateInfoAddress, deadline);
    }
    case 'whitelisting': {
      const {taskStateInfoAddress} = await takeInputForWhitelisting();
      console.log('Calling Whitelist');
      await Whitelist(payerWallet, taskStateInfoAddress);
    }
    case 'set-active': {
      console.log('Calling SetActive');
      const {taskStateInfoAddress} = await takeInputForSetActive();
      await SetActive(payerWallet, taskStateInfoAddress);
    }
    case 'payout': {
      console.log('Calling Payout');
      const {taskStateInfoAddress} = await takeInputForPayout();
      await Payout(payerWallet, taskStateInfoAddress);
    }
    case 'claim-reward': {
      console.log('Calling ClaimReward');
      const {taskStateInfoAddress} = await takeInputForClaimReward();
      await ClaimReward(payerWallet, taskStateInfoAddress);
    }
    case 'fund-task':
      console.log('Calling FundTask');
      const {taskStateInfoAddress} = await takeInputForFundTask();
      await FundTask(payerWallet, taskStateInfoAddress);
    default:
      console.error('Invalid option selected');
  }
  console.log('Success');
}

async function takeInputForCreateTask() {
  let task_name = (
    await prompts({
      type: 'text',
      name: 'task_name',
      message: 'Enter the name of the task',
    })
  ).task_name;
  do {
    console.error('The task name cannot be greater than 24 characters');
    task_name = (
      await prompts({
        type: 'text',
        name: 'task_name',
        message: 'Enter the name of the task',
      })
    ).task_name;
  } while (task_name.length > 24);

  let task_audit_program = (
    await prompts({
      type: 'text',
      name: 'task_audit_program',
      message: 'Enter Arweave id of the executable program',
    })
  ).task_audit_program;
  do {
    console.error('The task audit program length cannot be greater than 64 characters');
    task_audit_program = (
      await prompts({
        type: 'text',
        name: 'task_audit_program',
        message: 'Enter the name of the task',
      })
    ).task_audit_program;
  } while (task_audit_program.length > 64);
  
  const total_bounty_amount = (
    await prompts({
      type: 'number',
      name: 'total_bounty_amount',
      message: 'Enter the total bounty you want to allocate for the task (In KOII)',
      min: 10
    })
  ).total_bounty_amount;
  const bounty_amount_per_round = (
    await prompts({
      type: 'number',
      name: 'bounty_amount_per_round',
      message: 'Enter the bounty amount per round',
      max: total_bounty_amount,
      min: 1
    })
  ).bounty_amount_per_round;
  const deadline = (
    await prompts({
      type: 'number',
      name: 'deadline',
      message: 'Enter the deadline for task accepting submissions in unix',
      min: parseInt((Date.now()/1000).toFixed(2))
    })
  ).deadline;
  const space = (
    await prompts({
      type: 'number',
      name: 'space',
      message: 'Enter the space, you want to allocate for task account (in MBs)',
    })
  ).space;
  return {task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, deadline, space};
}

async function takeInputForSetTaskToVoting() {
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
  return {deadline, taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForWhitelisting() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForSetActive() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForPayout() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForClaimReward() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForFundTask() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the path to your wallet',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
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
