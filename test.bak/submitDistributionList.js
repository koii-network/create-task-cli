const {
  PublicKey,
  Connection,
  Keypair,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} = require("@_koi/web3.js");
// import * as moment from 'moment'
const fs = require("fs");
// eslint-disable-next-line
const BufferLayout = require("@solana/buffer-layout");


programId = new PublicKey('Koiitask22222222222222222222222222222222222');
let connection = new Connection("http://localhost:8899", 'confirmed');

// const connection = new Connection('https://k2-testnet.koii.live');
// const CLOCK_PUBLIC_KEY = new PublicKey(
//   'SysvarC1ock11111111111111111111111111111111',
// );
// const programId = new PublicKey('Koiitask22222222222222222222222222222222222');
// // const payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(process.env.WALLET_LOCATION, 'utf-8'))));

// const TASK_INSTRUCTION_LAYOUTS: any = Object.freeze({
//   SetTaskToVoting: {
//     index: 2,
//     layout: BufferLayout.struct([
//       BufferLayout.u8('instruction'),
//       BufferLayout.ns64('deadline'),
//     ]),
//   },
//   Payout: {
//     index: 4,
//     layout: BufferLayout.struct([BufferLayout.u8('instruction')]),
//   },
// });

// export default function updateTaskStatus() {
//   const allTasks = process.env.Tasks ? process.env.Tasks.split(',') : [];
//   const taskTimes = process.env.TaskTimes
//     ? process.env.TaskTimes.split(',')
//     : [];
//   if (allTasks.length != taskTimes.length)
//     throw new Error('Tasks and TaskTimes length are not matched');
//   for (let i = 0; i < allTasks?.length; i++) {
//     handleUpdate(allTasks[i], taskTimes[i]);
//     // cron.schedule(`* */${taskTimes[i]} * * *`, () => {
//     //   null;
//     // });
//   }
// }

// async function handleUpdate(taskId, taskTime) {
//   const taskDataRaw = (await connection.getAccountInfo(new PublicKey(taskId)))
//     ?.data;
//   const taskData = JSON.parse(taskDataRaw + '');
//   console.log(taskData)
//   const taskStatus =
//     Object.keys(taskData.status).length > 0
//       ? Object.keys(taskData.status)[0]
//       : '';
//   console.log(`wallets/${taskId}.json`)
//   if (!fs.existsSync(
//     `wallets/${taskId}.json`
//   )) {
//     console.error(`${taskId}.json doesn't exist`)
//     return
//   }
//   const payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(`wallets/${taskId}.json`, 'utf-8'))));
//   if (taskStatus == 'AcceptingSubmissions') {
//     console.log(`${taskData.task_name}-${taskId} setting to voting`)
//     await SetTaskToVoting(payerWallet, new PublicKey(taskId), moment().add(taskTime, "hours").unix())
//   } else if (taskStatus == 'Voting') {
//     console.log(`${taskData.task_name}-${taskId} calling payout`)
//     await Payout(payerWallet, new PublicKey(taskId))
//   }
//   console.log('taskStatus', taskStatus);
// }

// // --------------------------------------------------------------- Utility functions --------------------------

// export async function SetTaskToVoting(
//   payerWallet: Keypair,
//   taskStateInfoKeypair: PublicKey,
//   deadline: number,
// ): Promise<void> {
//   const data = encodeData(TASK_INSTRUCTION_LAYOUTS.SetTaskToVoting, {
//     deadline: deadline,
//   });
//   const instruction = new TransactionInstruction({
//     keys: [
//       { pubkey: taskStateInfoKeypair, isSigner: false, isWritable: true },
//       { pubkey: payerWallet.publicKey, isSigner: true, isWritable: true },
//       { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
//     ],
//     programId,
//     data: data,
//   });
//   await sendAndConfirmTransaction(
//     connection,
//     new Transaction().add(instruction),
//     [payerWallet],
//   );
// }

// export async function Payout(
//   payerWallet: Keypair,
//   taskStateInfoAddress: PublicKey,
// ): Promise<void> {
//   const data = encodeData(TASK_INSTRUCTION_LAYOUTS.Payout, {});
//   const instruction = new TransactionInstruction({
//     keys: [
//       { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
//       { pubkey: payerWallet.publicKey, isSigner: true, isWritable: true },
//       { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
//     ],
//     programId,
//     data: data,
//   });
//   await sendAndConfirmTransaction(
//     connection,
//     new Transaction().add(instruction),
//     [payerWallet],
//   );
// }

// function encodeData(type: any, fields: any) {
//   const allocLength =
//     type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
//   const data = Buffer.alloc(allocLength);
//   const layoutFields = Object.assign({ instruction: type.index }, fields);
//   type.layout.encode(layoutFields, data);
//   return data;
// }
// function getAlloc(type: any, fields: any) {
//   let alloc = 0;
//   type.layout.fields.forEach((item: any) => {
//     if (item.span >= 0) {
//       alloc += item.span;
//     } else if (typeof item.alloc === 'function') {
//       alloc += item.alloc(fields[item.property]);
//     }
//   });
//   return alloc;
// }

async function createAccount() {
  let payerWallet;
  let walletPath = process.env.wallet || "";
  if (!process.env.wallet) {
    console.error("No wallet found");
    walletPath = "./wallet.json";
    console.log(walletPath);
    if (!fs.existsSync(walletPath)) throw Error("Invalid Wallet Path");
  }
  try {
    let wallet = fs.readFileSync(walletPath, "utf-8");
    payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet)));
  } catch (e) {
    console.error("Wallet Doesn't Exist");
    process.exit();
  }
  let taskStateInfoKeypair = Keypair.generate();
  const createTaskStateTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: taskStateInfoKeypair.publicKey,
      lamports: (await connection.getMinimumBalanceForRentExemption(30)) + 10000000,
      space: 300,
      programId: programId,
    })
  );
  await sendAndConfirmTransaction(connection, createTaskStateTransaction, [
    payerWallet,
    taskStateInfoKeypair,
  ]);
  fs.writeFileSync(
    "taskStateInfoKeypair.json",
    JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
  );
  console.log('Task Id:', taskStateInfoKeypair.publicKey.toBase58());

  // console.log('Stake Pot Account Pubkey:', stake_pot_account_pubkey.toBase58());
  console.log(
    "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
  );
}
createAccount();


// async function uploadFile(data,,){



// }