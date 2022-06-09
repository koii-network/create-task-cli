/**
 * Hello world
 */

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  SetTaskToVoting,
  Whitelist,
  SetActive,
  Payout,
  ClaimReward,
  FundTask,
} from './task_contract';
import prompts from 'prompts';
import {Keypair, PublicKey, LAMPORTS_PER_SOL} from '@_koi/web3.js';
import fs from 'fs';

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
  await establishPayer(payerWallet);

  // Check if the program has been deployed
  await checkProgram();

  switch (mode) {
    case 'create-task': {
      const {task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, deadline, space} =
        await takeInputForCreateTask();
      let totalAmount =
        LAMPORTS_PER_SOL * total_bounty_amount +
        (await connection.getMinimumBalanceForRentExemption(100)) +
        10000 +
        (await connection.getMinimumBalanceForRentExemption(space)) +
        10000;
      let response = (
        await prompts({
          type: 'confirm',
          name: 'response',
          message: `Your account will be subtract ${
            totalAmount / LAMPORTS_PER_SOL
          } KOII for creating the task, which includes the rent exemption and bounty amount fees`,
        })
      ).response;
      if (!response) process.exit(0);
      let lamports = await connection.getBalance(payerWallet.publicKey);
      if (lamports < totalAmount) {
        console.error('Insufficient balance for this operation');
        process.exit(0);
      }
      console.log('Calling Create Task');
      let {taskStateInfoKeypair, stake_pot_account} = await createTask(
        payerWallet,
        task_name,
        task_audit_program,
        total_bounty_amount,
        bounty_amount_per_round,
        deadline,
        space
      );
      fs.writeFileSync('taskStateInfoKeypair.json', JSON.stringify(Array.from(taskStateInfoKeypair.secretKey)));
      fs.writeFileSync('stake_pot_account.json', JSON.stringify(Array.from(stake_pot_account.secretKey)));
      console.log('Task State Info Pubkey:', taskStateInfoKeypair.publicKey.toBase58());
      console.log('Stake Pot Account Pubkey:', stake_pot_account.publicKey.toBase58());
      break;
    }
    case 'set-task-to-voting': {
      const {taskStateInfoAddress, deadline} = await takeInputForSetTaskToVoting();
      console.log('Calling SetTaskToVoting');
      await SetTaskToVoting(payerWallet, taskStateInfoAddress, deadline);
      break;
    }
    case 'whitelisting': {
      const {taskOwnerAddress, taskStateInfoAddress} = await takeInputForWhitelisting();
      console.log('Calling Whitelist');
      await Whitelist(payerWallet, taskStateInfoAddress, taskOwnerAddress);
      break;
    }
    case 'set-active': {
      console.log('Calling SetActive');
      const {isActive, taskStateInfoAddress} = await takeInputForSetActive();
      await SetActive(payerWallet, taskStateInfoAddress, isActive);
      break;
    }
    case 'payout': {
      console.log('Calling Payout');
      const {taskStateInfoAddress} = await takeInputForPayout();
      await Payout(payerWallet, taskStateInfoAddress);
      break;
    }
    case 'claim-reward': {
      console.log('Calling ClaimReward');
      const {beneficiaryAccount, stakePotAccount, taskStateInfoAddress, claimerKeypair} = await takeInputForClaimReward();
      await ClaimReward(payerWallet, taskStateInfoAddress, stakePotAccount, beneficiaryAccount, claimerKeypair);
      break;
    }
    case 'fund-task':
      console.log('Calling FundTask');
      const {stakePotAccount, taskStateInfoAddress, amount} = await takeInputForFundTask();
      await FundTask(payerWallet, taskStateInfoAddress, stakePotAccount, amount);
      break;
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
  while (task_name.length > 24) {
    console.error('The task name cannot be greater than 24 characters');
    task_name = (
      await prompts({
        type: 'text',
        name: 'task_name',
        message: 'Enter the name of the task',
      })
    ).task_name;
  }

  let task_audit_program = (
    await prompts({
      type: 'text',
      name: 'task_audit_program',
      message: 'Enter Arweave id of the executable program',
    })
  ).task_audit_program;
  while (task_audit_program.length > 64) {
    console.error('The task audit program length cannot be greater than 64 characters');
    task_audit_program = (
      await prompts({
        type: 'text',
        name: 'task_audit_program',
        message: 'Enter the name of the task',
      })
    ).task_audit_program;
  }

  let total_bounty_amount = (
    await prompts({
      type: 'number',
      name: 'total_bounty_amount',
      message: 'Enter the total bounty you want to allocate for the task (In KOII)',
    })
  ).total_bounty_amount;
  while (total_bounty_amount < 10) {
    console.error('The total_bounty_amount cannot be less than 10');
    total_bounty_amount = (
      await prompts({
        type: 'number',
        name: 'total_bounty_amount',
        message: 'Enter the total bounty you want to allocate for the task (In KOII)',
      })
    ).total_bounty_amount;
  }
  let bounty_amount_per_round = (
    await prompts({
      type: 'number',
      name: 'bounty_amount_per_round',
      message: 'Enter the bounty amount per round',
      // max: total_bounty_amount,
    })
  ).bounty_amount_per_round;
  while (bounty_amount_per_round > total_bounty_amount) {
    console.error('The bounty_amount_per_round cannot be greater than total_bounty_amount');
    bounty_amount_per_round = (
      await prompts({
        type: 'number',
        name: 'bounty_amount_per_round',
        message: 'Enter the bounty amount per round',
      })
    ).bounty_amount_per_round;
  }
  let deadline = (
    await prompts({
      type: 'text',
      name: 'deadline',
      message: 'Enter the deadline for task accepting submissions in unix',
    })
  ).deadline;
  deadline = Number(deadline);
  while (isNaN(deadline) || deadline < parseInt((Date.now() / 1000).toFixed(2))) {
    console.error('The deadline cannot be of a past date or non unix');
    deadline = (
      await prompts({
        type: 'number',
        name: 'deadline',
        message: 'Enter the deadline for task accepting submissions in unix',
      })
    ).deadline;
  }
  let space = (
    await prompts({
      type: 'number',
      name: 'space',
      message: 'Enter the space, you want to allocate for task account (in MBs)',
    })
  ).space;
  while (space < 3) {
    console.error('Space cannot be less than 3 mb');
    space = (
      await prompts({
        type: 'number',
        name: 'space',
        message: 'Enter the space, you want to allocate for task account (in MBs)',
      })
    ).space;
  }
  return {task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, deadline, space};
}

async function takeInputForSetTaskToVoting() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the task account address',
    })
  ).taskStateInfoAddress;
  const deadline = (
    await prompts({
      type: 'number',
      name: 'deadline',
      message: 'Enter the deadline for task accepting votes in unix',
      min: parseInt((Date.now() / 1000).toFixed(2)),
    })
  ).deadline;
  return {deadline, taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForWhitelisting() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the task account address',
    })
  ).taskStateInfoAddress;
  const taskOwnerAddress = (
    await prompts({
      type: 'text',
      name: 'taskOwnerAddress',
      message: 'Enter the path to taskOwnerAddress wallet',
    })
  ).taskOwnerAddress;
  return {taskOwnerAddress, taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForSetActive() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the task account address',
    })
  ).taskStateInfoAddress;
  const isActive = (
    await prompts({
      type: 'select',
      name: 'isActive',
      message: 'Do you want to set the task to Active or Inactive?',
      choices: [
        {title: 'Active', description: 'Set the task active', value: 'Active'},
        {title: 'Inactive', description: 'Deactivate the task', value: 'Inactive'},
      ],
    })
  ).isActive;
  return {isActive: isActive == 'Active', taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForPayout() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the task account address',
    })
  ).taskStateInfoAddress;
  return {taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForClaimReward() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the task account address',
    })
  ).taskStateInfoAddress;
  const stakePotAccount = (
    await prompts({
      type: 'text',
      name: 'stakePotAccount',
      message: 'Enter the stakePotAccount address',
    })
  ).stakePotAccount;
  const beneficiaryAccount = (
    await prompts({
      type: 'text',
      name: 'beneficiaryAccount',
      message: 'Enter the beneficiaryAccount address (Address that the funds will be transferred to)',
    })
  ).beneficiaryAccount;
  const claimerKeypair = (
    await prompts({
      type: 'text',
      name: 'claimerKeypair',
      message: 'Enter the path to Claimer wallet',
    })
  ).claimerKeypair;
  return {claimerKeypair,beneficiaryAccount:new PublicKey(beneficiaryAccount),stakePotAccount: new PublicKey(stakePotAccount), taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
}
async function takeInputForFundTask() {
  const taskStateInfoAddress = (
    await prompts({
      type: 'text',
      name: 'taskStateInfoAddress',
      message: 'Enter the task account address',
    })
  ).taskStateInfoAddress;
  const stakePotAccount = (
    await prompts({
      type: 'text',
      name: 'stakePotAccount',
      message: 'Enter the stakePotAccount address',
    })
  ).stakePotAccount;
  const amount = (
    await prompts({
      type: 'text',
      name: 'amount',
      message: 'Enter the amount(in KOII) to fund',
    })
  ).amount;
  return {amount:amount*LAMPORTS_PER_SOL, stakePotAccount: new PublicKey(stakePotAccount), taskStateInfoAddress: new PublicKey(taskStateInfoAddress)};
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
