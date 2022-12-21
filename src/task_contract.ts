/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@_koi/web3.js';
import fs from 'mz/fs';
import path from 'path';
const BufferLayout = require('@solana/buffer-layout');
const rustString = (property = 'string') => {
  const rsl = BufferLayout.struct(
    [
      BufferLayout.u32('length'),
      BufferLayout.u32('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ],
    property
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  rsl.decode = (buffer: any, offset: any) => {
    const data = _decode(buffer, offset);
    return data['chars'].toString('utf8');
  };

  rsl.encode = (str: any, buffer: any, offset: any) => {
    const data = {
      chars: Buffer.from(str, 'utf8'),
    };
    return _encode(data, buffer, offset);
  };

  rsl.alloc = (str: any) => {
    return BufferLayout.u32().span + BufferLayout.u32().span + Buffer.from(str, 'utf8').length;
  };

  return rsl;
};
const publicKey = (property = 'publicKey') => {
  return BufferLayout.blob(32, property);
};
const toBuffer = (arr: any) => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};
import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';

const SYSTEM_PUBLIC_KEY = new PublicKey('11111111111111111111111111111111');
const CLOCK_PUBLIC_KEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');
// let STAKE_POT_ACCOUNT: PublicKey;
// =new PublicKey("9XABSvWLMkUV1hPb4bXbJqvsH3Ab2mptxMMMnxfJUvG9")
/**
 * Connection to the network
 */
let connection: Connection;

/**
 * Keypair associated to the fees' payer
 */
// let payerWallet: Keypair;

/**
 * Hello world's program id
 */
let programId: PublicKey;

/**
 * The public key of the account we are saying hello to
 */
let greetedPubkey: PublicKey;

/**
 * Path to program files
 */
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

/**
 * Path to program shared object file which should be deployed on chain.
 * This file is created when running either:
 *   - `npm run build:program-c`
 *   - `npm run build:program-rust`
 */
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'helloworld.so');

/**
 * Path to the keypair of the deployed program.
 * This file is created when running `solana program deploy task_contract-keypair.json`
 */
// const PROGRAM_KEYPAIR_PATH = 'TaskMDbVartWDkgHrWZ6NiHUQUwdWpN3WDyRmSEoMTm.json';

const TASK_INSTRUCTION_LAYOUTS: any = Object.freeze({
  CreateTask: {
    index: 0,
    layout: BufferLayout.struct([
      BufferLayout.u8('instruction'),
      BufferLayout.blob(24, 'task_name'),
      BufferLayout.blob(64, 'task_description'),
      BufferLayout.blob(64, 'task_audit_program'),
      BufferLayout.blob(64, 'task_executable_network'),
      BufferLayout.ns64('total_bounty_amount'),
      BufferLayout.ns64('bounty_amount_per_round'),
      BufferLayout.ns64('round_time'),
      BufferLayout.ns64('audit_window'),
      BufferLayout.ns64('submission_window'),

      // publicKey('stake_pot_account')
    ]),
  },
  SubmitTask: {
    index: 1,
    layout: BufferLayout.struct([
      BufferLayout.u8('instruction'),
      BufferLayout.blob(512, 'submission'),
      BufferLayout.ns64('stakeAmount'),
    ]),
  },
  SetTaskToVoting: {
    index: 2,
    layout: BufferLayout.struct([BufferLayout.u8('instruction'), BufferLayout.ns64('deadline')]),
  },
  Vote: {
    index: 3,
    layout: BufferLayout.struct([
      BufferLayout.u8('instruction'),
      BufferLayout.ns64('is_valid'),
      BufferLayout.ns64('stake_amount'),
    ]),
  },
  Payout: {
    index: 4,
    layout: BufferLayout.struct([BufferLayout.u8('instruction')]),
  },
  WithdrawSubmission: {
    index: 5,
    layout: BufferLayout.struct([BufferLayout.u8('instruction')]),
  },
  Whitelist: {
    index: 6,
    layout: BufferLayout.struct([BufferLayout.u8('instruction'), BufferLayout.ns64('isWhitelisted')]),
  },
  SetActive: {
    index: 7,
    layout: BufferLayout.struct([BufferLayout.u8('instruction'), BufferLayout.ns64('isActive')]),
  },
  ClaimReward: {
    index: 8,
    layout: BufferLayout.struct([BufferLayout.u8('instruction')]),
  },
  FundTask: {
    index: 9,
    layout: BufferLayout.struct([BufferLayout.u8('instruction'), BufferLayout.ns64('amount')]),
  },
});

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<Connection> {
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
  return connection;
}

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(payerWallet: Keypair): Promise<void> {
  let fees = 0;
  if (!payerWallet) {
    const {feeCalculator} = await connection.getRecentBlockhash();

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(1000);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    payerWallet = await getPayer();
  }

  let lamports = await connection.getBalance(payerWallet.publicKey);
  if (lamports < fees) {
    console.error('Your balance is not sufficient: ' + payerWallet.publicKey.toBase58);
    process.exit(0);
    // If current balance is not enough to pay for fees, request an airdrop
    // const sig = await connection.requestAirdrop(payer.publicKey, 100000000000 + fees - lamports);
    // await connection.confirmTransaction(sig);
    // lamports = await connection.getBalance(payer.publicKey);
  }

  console.log(
    'Using account',
    payerWallet.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for fees'
  );
}

/**
 * Check if the hello world BPF program has been deployed
 */
export async function checkProgram(): Promise<void> {
  // Read program id from keypair file
  try {
    programId = new PublicKey('Koiitask22222222222222222222222222222222222');
  } catch (err) {
    const errMsg = (err as Error).message;
    throw new Error(
      `Failed to read program keypair at due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``
    );
  }

  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error('Program needs to be deployed with `solana program deploy dist/program/helloworld.so`');
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  console.log(`Using program ${programId.toBase58()}`);
}
function encodeData(type: any, fields: any) {
  const allocLength = type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign({instruction: type.index}, fields);
  type.layout.encode(layoutFields, data);
  return data;
}
function getAlloc(type: any, fields: any) {
  let alloc = 0;
  type.layout.fields.forEach((item: any) => {
    if (item.span >= 0) {
      alloc += item.span;
    } else if (typeof item.alloc === 'function') {
      alloc += item.alloc(fields[item.property]);
    }
  });
  return alloc;
}

function padStringWithSpaces(input: string, length: number) {
  if (input.length > length) throw Error('Input exceeds the maxiumum length of ' + length);
  input = input.padEnd(length);
  return input;
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
  submission_window: number
): Promise<any> {
  // Checks
  if (round_time < audit_window + submission_window)
    throw new Error('Round time cannot be less than audit_window + submission_window');
  if (task_description.length > 64) throw new Error('task_description cannot be greater than 64 characters');

  let createTaskData = {
    task_name: new TextEncoder().encode(padStringWithSpaces(task_name, 24)),
    task_description: new TextEncoder().encode(padStringWithSpaces(task_description, 64)),
    task_audit_program: new TextEncoder().encode(padStringWithSpaces(task_audit_program, 64)), //must be 64 chracters long
    task_executable_network: new TextEncoder().encode(padStringWithSpaces(task_executable_network, 64)), //must be 64 chracters long
    total_bounty_amount: total_bounty_amount * LAMPORTS_PER_SOL,
    bounty_amount_per_round: bounty_amount_per_round * LAMPORTS_PER_SOL,
    round_time: round_time,
    audit_window: audit_window,
    submission_window: submission_window,
    rentExemptionAmount: (await connection.getMinimumBalanceForRentExemption(space)) + 1000,
    space: space,
  };
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.CreateTask, createTaskData);
  let taskStateInfoKeypair = Keypair.generate();
  let stake_pot_account_pubkey: PublicKey = getStakePotAccount();

  const createTaskStateTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: taskStateInfoKeypair.publicKey,
      lamports: createTaskData.rentExemptionAmount,
      space: createTaskData.space,
      programId: programId,
    })
  );
  await sendAndConfirmTransaction(connection, createTaskStateTransaction, [payerWallet, taskStateInfoKeypair]);
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: payerWallet.publicKey, isSigner: true, isWritable: true},
      {pubkey: taskStateInfoKeypair.publicKey, isSigner: true, isWritable: true},
      {pubkey: stake_pot_account_pubkey, isSigner: false, isWritable: true},
      {pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet, taskStateInfoKeypair]);
  return {taskStateInfoKeypair, stake_pot_account_pubkey};
}
async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// export async function submitTask(taskStateInfoKeypair: Keypair): Promise<PublicKey> {
//   const data = encodeData(TASK_INSTRUCTION_LAYOUTS.SubmitTask, {
//     submission: new TextEncoder().encode(padStringWithSpaces('test1111111111111111111111111111', 512)), //must be 512 chracters long
//     stakeAmount: 10000000,
//   });
//   let submitterKeypair = Keypair.generate();
//   console.log('Making new account', submitterKeypair.publicKey.toBase58());

//   const createSubmitterAccTransaction = new Transaction().add(
//     SystemProgram.createAccount({
//       fromPubkey: payer.publicKey,
//       newAccountPubkey: submitterKeypair.publicKey,
//       lamports: 10000000 + (await connection.getMinimumBalanceForRentExemption(100)) + 10000, //Adding 10,000 extra lamports for padding
//       space: 100,
//       programId: programId,
//     })
//   );
//   await sendAndConfirmTransaction(connection, createSubmitterAccTransaction, [payer, submitterKeypair]);
//   await sleep(10000);
//   console.log('CAAALLL', submitterKeypair.publicKey.toBase58());
//   const instruction = new TransactionInstruction({
//     keys: [
//       {pubkey: taskStateInfoKeypair.publicKey, isSigner: false, isWritable: true},
//       {pubkey: submitterKeypair.publicKey, isSigner: true, isWritable: true},
//       {pubkey: STAKE_POT_ACCOUNT, isSigner: false, isWritable: true},
//       {pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false},
//       {pubkey: SYSTEM_PUBLIC_KEY, isSigner: false, isWritable: false},
//     ],
//     programId,
//     data: data,
//   });
//   await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payer, submitterKeypair]);
//   return submitterKeypair.publicKey;
// }

export async function SetTaskToVoting(
  payerWallet: Keypair,
  taskStateInfoKeypair: PublicKey,
  deadline: number
): Promise<void> {
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.SetTaskToVoting, {
    deadline: deadline,
  });
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: taskStateInfoKeypair, isSigner: false, isWritable: true},
      {pubkey: payerWallet.publicKey, isSigner: true, isWritable: true},
      {pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet]);
}
// export async function Vote(
//   payerWallet: Keypair,
//   taskStateInfoKeypair: Keypair,
//   submitterPubkey: PublicKey
// ): Promise<void> {
//   const data = encodeData(TASK_INSTRUCTION_LAYOUTS.Vote, {
//     is_valid: 1,
//     stake_amount: 100000,
//   });
//   let voterKeypair = Keypair.generate();
//   console.log('Making new account', voterKeypair.publicKey.toBase58());

//   const createSubmitterAccTransaction = new Transaction().add(
//     SystemProgram.createAccount({
//       fromPubkey: payerWallet.publicKey,
//       newAccountPubkey: voterKeypair.publicKey,
//       lamports: 100000 + (await connection.getMinimumBalanceForRentExemption(100)) + 1000, //adding 1000 extra lamports for padding
//       space: 100,
//       programId: programId,
//     })
//   );
//   await sendAndConfirmTransaction(connection, createSubmitterAccTransaction, [payerWallet, voterKeypair]);
//   const instruction = new TransactionInstruction({
//     keys: [
//       {pubkey: taskStateInfoKeypair.publicKey, isSigner: false, isWritable: true},
//       {pubkey: voterKeypair.publicKey, isSigner: true, isWritable: true},
//       {pubkey: submitterPubkey, isSigner: false, isWritable: false}, //Candidate public key who submitted the task and you are approving whose task is correct
//       {pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false},
//       {pubkey: STAKE_POT_ACCOUNT, isSigner: false, isWritable: true},
//       {pubkey: SYSTEM_PUBLIC_KEY, isSigner: false, isWritable: false},
//     ],
//     programId,
//     data: data,
//   });
//   await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet, voterKeypair]);
// }
export async function Whitelist(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  PROGRAM_KEYPAIR_PATH: string
): Promise<void> {
  const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);

  console.log('WHITELIST', programKeypair.publicKey.toBase58());
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.Whitelist, {
    isWhitelisted: 1,
  });
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: taskStateInfoAddress, isSigner: false, isWritable: true},
      {pubkey: programKeypair.publicKey, isSigner: true, isWritable: false},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet, programKeypair]);
}
export async function SetActive(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  setActive: boolean
): Promise<void> {
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.SetActive, {
    isActive: setActive ? 1 : 0,
  });
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: taskStateInfoAddress, isSigner: false, isWritable: true},
      {pubkey: payerWallet.publicKey, isSigner: true, isWritable: false},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet]);
}
export async function Payout(payerWallet: Keypair, taskStateInfoAddress: PublicKey): Promise<void> {
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.Payout, {});
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: taskStateInfoAddress, isSigner: false, isWritable: true},
      {pubkey: payerWallet.publicKey, isSigner: true, isWritable: true},
      {pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet]);
}
export async function ClaimReward(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  beneficiaryAccount: PublicKey,
  claimerKeypairPath: string
): Promise<void> {
  const claimerKeypair = await createKeypairFromFile(claimerKeypairPath);
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.ClaimReward, {});
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: taskStateInfoAddress, isSigner: false, isWritable: true},
      {pubkey: claimerKeypair.publicKey, isSigner: true, isWritable: true},
      {pubkey: stakePotAccount, isSigner: false, isWritable: true},
      {pubkey: beneficiaryAccount, isSigner: false, isWritable: true},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet, claimerKeypair]);
}

export async function FundTask(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  amount: number
): Promise<void> {
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.FundTask, {
    amount,
  });
  let funderKeypair = Keypair.generate();
  console.log('Making new account', funderKeypair.publicKey.toBase58());

  const createSubmitterAccTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: funderKeypair.publicKey,
      lamports: amount + (await connection.getMinimumBalanceForRentExemption(100)) + 1000, //adding 1000 extra lamports for padding
      space: 100,
      programId: programId,
    })
  );
  await sendAndConfirmTransaction(connection, createSubmitterAccTransaction, [payerWallet, funderKeypair]);
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: taskStateInfoAddress, isSigner: false, isWritable: true},
      {pubkey: funderKeypair.publicKey, isSigner: true, isWritable: true},
      {pubkey: stakePotAccount, isSigner: false, isWritable: true},
      {pubkey: SYSTEM_PUBLIC_KEY, isSigner: false, isWritable: false},
      {pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false},
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payerWallet, funderKeypair]);
}

function getStakePotAccount(): PublicKey {
  let pubkey;
  while (true) {
    try {
      let keypair = new Keypair();
      let pubkeyString = keypair.publicKey.toBase58();
      pubkeyString = pubkeyString.replace(pubkeyString.substring(0, 15), 'stakepotaccount');
      pubkey = new PublicKey(pubkeyString);
      if (PublicKey.isOnCurve(pubkey.toBytes())) {
        break;
      }
    } catch (e) {}
  }
  return pubkey;
}
