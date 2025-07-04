/* eslint-disable prefer-const */
/**
 * File Structure:
 * This file's checkprogram(), establishConnection(), estabilishPayer() part comes from the k2-task-program-bpf repo.
 * The other functions, like createTask() takes the input from the task_contract.ts file and the main part takes from the k2-task-program-bpf repo.
 */
import {
  getRpcUrl,
  createKeypairFromFile,
} from './util';
import chalk from 'chalk';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { getKPLDigits } from './util';
import {
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import {
  createTaskInstruction,
  fundTaskInstruction,
  updateTaskInstruction,
  claimRewardInstruction,
  setActiveInstruction,
  withdrawInstruction,
} from './instructions';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { sendAndConfirmTransactionWithRetries } from '../utils/transaction';
import dotenv from 'dotenv';
import {
  Connection as KoiiConnection,
  Transaction as KoiiTransaction,
} from '@_koii/web3.js';
import { KPLProgramID } from '../constant';
dotenv.config();
/**
 * Connection to the network
 */
let connection: Connection;

export async function establishConnection(): Promise<Connection> {
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  console.log(chalk.green.bold('KPL Program Connection Estabilished.'));
  return connection;
}

// Keypair associated to the fees' payer
let payer: Keypair;
/**
 * Establish an account to pay for everything
 */
export async function establishPayer(payperson: Keypair) {
  payer = payperson;
}
/**
 * k2-task-program-bpf's program id
 */
let programId: PublicKey;

/**
 * Check if the k2-task-program-bpf program has been deployed
 */
export async function checkProgram(): Promise<PublicKey> {
  // Read program id from keypair file
  try {
    programId = new PublicKey(KPLProgramID);
  } catch (err) {
    const errMsg = (err as Error).message;
    throw new Error(
      `Failed to read program keypair at due to error: ${errMsg}. The task executable need to be uploaded. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
    );
  }

  // Check if the program has been deployed

  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    throw new Error(
      'You are NOT on the right network. KPL Token Feature CANNOT be used. ',
    );
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  // console.log(`KPL Program ID: ${programId.toBase58()}`);

  return programId;
}
function getStakePotAccount(): Keypair {
  let pubkey;
  let keypair;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      keypair = new Keypair();
      let pubkeyString = keypair.publicKey.toBase58();
      pubkeyString = pubkeyString.replace(
        pubkeyString.substring(0, 15),
        'stakepotaccount',
      );
      pubkey = new PublicKey(pubkeyString);
      if (PublicKey.isOnCurve(pubkey.toBytes())) {
        break;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  return keypair;
}
function cleanForUint8Array(str:string) {
  // Keep only printable ASCII (codes 32–126)
  return str
    .split('')
    .filter(char => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join('');
}
export async function createTask(
  payerWallet: Keypair,
  task_name: string,
  task_audit_program: string,
  total_bounty_amount: number,
  bounty_amount_per_round: number,
  space: number,
  task_description: string,
  task_executable_network: string,
  round_time: number,
  audit_window: number,
  submission_window: number,
  minimum_stake_amount: number,
  task_metadata: string,
  local_vars: string,
  koii_vars: string,
  allowed_failed_distributions: number,
  mint_address: string,
): Promise<any> {
  /** Data Processing */
  const mint_digits = await getKPLDigits(mint_address, connection);
  const createTaskData = {
    task_name: task_name,
    task_description: cleanForUint8Array(task_description),
    task_audit_program: task_audit_program, //must be 64 chracters long
    task_executable_network: task_executable_network, //must be 64 chracters long
    total_bounty_amount: total_bounty_amount,
    bounty_amount_per_round: bounty_amount_per_round,
    submission_window: submission_window,
    round_time: round_time,
    audit_window: audit_window,
    minimum_stake_amount: minimum_stake_amount * 10 ** mint_digits,
    task_metadata: task_metadata,
    task_locals: local_vars,
    allowed_failed_distributions: allowed_failed_distributions,
    mint_address: mint_address,
    mint_digits: mint_digits,
  };
  /** Create Account Part */
  // const wallet = token_account;
  const stakePot = getStakePotAccount();
  const taskState = Keypair.generate();
  /** Create Task Part */
  let tokenAccountWallet = await getOrCreateAssociatedTokenAccount(
    connection as any,
    payerWallet,
    new PublicKey(mint_address),
    payerWallet.publicKey,
  );
  let lamports = await connection.getMinimumBalanceForRentExemption(space)+1000;
  const createTaskStateInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: taskState.publicKey,
    lamports: lamports,
    space: space,
    programId: programId,
  });
  let tx = await createTaskInstruction(createTaskData, {
    payer: payer.publicKey,
    wallet: new PublicKey(tokenAccountWallet.address),
    taskState: taskState.publicKey,
    stakePot: stakePot.publicKey,
    programId,
  });
  await sendAndConfirmTransactionWithRetries(
    connection as unknown as KoiiConnection,
    new Transaction()
      .add(createTaskStateInstruction)
      .add(tx) as unknown as KoiiTransaction,
    [payer, taskState, stakePot],
  );
  return {
    taskStateInfoKeypair: taskState,
    stake_pot_account_pubkey: stakePot.publicKey,
  };
}
export async function FundTask(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  amount: number,
  mint_address: string,
): Promise<void> {
  let mint_digits = await getKPLDigits(mint_address, connection);
  let tx = await fundTaskInstruction(
    {
      amount,
      mint_address,
      mint_digits,
    },
    {
      taskState: taskStateInfoAddress,
      stakePot: stakePotAccount,
      submitter: payerWallet.publicKey,
      programId,
    },
  );
  await sendAndConfirmTransactionWithRetries(
    connection as unknown as KoiiConnection,
    new Transaction().add(tx) as unknown as KoiiTransaction,
    [payerWallet],
  );
}

export async function updateTask(
  payerWallet: Keypair,
  task_name: string,
  task_audit_program: string,
  bounty_amount_per_round: number,
  space: number,
  task_description: string,
  task_executable_network: string,
  round_time: number,
  audit_window: number,
  submission_window: number,
  minimum_stake_amount: number,
  task_metadata: string,
  local_vars: string,
  allowed_failed_distributions: number,
  taskAccountInfoPubKey: PublicKey,
  stake_pot_account_pubkey: PublicKey,
  mint_address: string,
): Promise<{
  newTaskStateInfoKeypair: Keypair;
  newStake_pot_account_pubkey: PublicKey;
}> {
  const mint_digits = await getKPLDigits(mint_address, connection);
  const stakePot = stake_pot_account_pubkey;
  const taskStatepubkey = taskAccountInfoPubKey;
  const newTaskState = await Keypair.generate();
  const newStakePot = await getStakePotAccount();
  let lamports = await connection.getMinimumBalanceForRentExemption(space)+1000;
  const createTaskStateInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: newTaskState.publicKey,
    lamports: lamports,
    space: space,
    programId: programId,
  });

  let tx = await updateTaskInstruction(
    {
      task_name: task_name,
      task_description: cleanForUint8Array(task_description),
      task_audit_program: task_audit_program,
      task_executable_network: task_executable_network,
      bounty_amount_per_round: bounty_amount_per_round,
      round_time: round_time,
      audit_window: audit_window,
      submission_window: submission_window,
      minimum_stake_amount: minimum_stake_amount * 10 ** mint_digits,
      task_metadata: task_metadata,
      task_locals: local_vars,
      allowed_failed_distributions: allowed_failed_distributions,
      mint_address,
      mint_digits,
    },
    {
      payer: payer.publicKey,
      taskState: taskStatepubkey,
      stakePot: stakePot,
      newStakePot: newStakePot.publicKey,
      newTaskState: newTaskState.publicKey,
      programId,
    },
  );
  await sendAndConfirmTransactionWithRetries(
    connection as unknown as KoiiConnection,
    new Transaction()
      .add(createTaskStateInstruction)
      .add(tx) as unknown as KoiiTransaction,
    [payer, newTaskState, newStakePot],
  );
  return {
    newTaskStateInfoKeypair: newTaskState,
    newStake_pot_account_pubkey: newStakePot.publicKey,
  };
}
export async function SetActive(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  setActive: boolean,
): Promise<void> {
  let isActive: number = setActive ? 1 : 0;
  let programId = await checkProgram();
  let tx = await setActiveInstruction(
    { is_active: isActive },
    {
      taskState: taskStateInfoAddress,
      ownerOrManager: payerWallet.publicKey,
      programId,
    },
  );

  await sendAndConfirmTransactionWithRetries(
    connection as unknown as KoiiConnection,
    new Transaction().add(tx) as unknown as KoiiTransaction,
    [payerWallet],
  );
}
export async function ClaimReward(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  beneficiaryAccount: PublicKey,
  claimerKeypairPath: string,
  mint_address: string,
): Promise<void> {
  const submitterWallet = await createKeypairFromFile(claimerKeypairPath);
  let beneficiaryAssociateAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerWallet,
    new PublicKey(mint_address),
    beneficiaryAccount,
  );

  let tx = await claimRewardInstruction({
    taskState: taskStateInfoAddress,
    stakePot: stakePotAccount,
    claimer: submitterWallet.publicKey,
    beneficiary: beneficiaryAssociateAccount.address,
    programId,
  });
  await sendAndConfirmTransactionWithRetries(
    connection as unknown as KoiiConnection,
    new Transaction().add(tx) as unknown as KoiiTransaction,
    [payerWallet, submitterWallet],
  );
}

export async function Withdraw(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  submitterKeypair: Keypair,
): Promise<void> {
  let tx = await withdrawInstruction({
    taskState: taskStateInfoAddress,
    submitter: submitterKeypair.publicKey,
    programId,
  });

  await sendAndConfirmTransactionWithRetries(
    connection as unknown as KoiiConnection,
    new Transaction().add(tx) as unknown as KoiiTransaction,
    [payerWallet, submitterKeypair],
  );
}
