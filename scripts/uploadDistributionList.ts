import {
  Keypair,
  LAMPORTS_PER_SOL,
  AttentionProgram,
  TransactionInstruction,
  Transaction,
  PublicKey,
  Connection,
} from "@_koi/web3.js";
import * as BufferLayout from "buffer-layout";


// BELOW ALL CODE FOR SUBMITTING DATA TO K2 CHAIN

const CHUNKNUM_BYTE_COUNT = 2; // u16 int, which chunk
const CHUNKSIZE_BYTE_COUNT = 2; // u16 int, how big are chunks
const DATA_UPLOAD_PROGRAM_ID = "Koiitask22222222222222222222222222222222222";

// The function to send the ports and recipients data to a K2 account since all data cannot be sent in 1 tx
export async function uploadDistributionList(
  distributionListDataBlob: Buffer,
  mainSystemAccountPubkey: PublicKey,
  distributionListAccount: Keypair
): Promise<PublicKey | null> {
  console.log("MAIN SYSTEM PUBKEY", mainSystemAccountPubkey.toBase58());
  let data = distributionListDataBlob;
  console.log("ProgramId to use:", DATA_UPLOAD_PROGRAM_ID);

  console.log("Data contains", data.length, "bytes");

  // split our data across a number of calls

  const remainingByteCount = 512;

  const dataByteCount =
    remainingByteCount - (CHUNKNUM_BYTE_COUNT + CHUNKSIZE_BYTE_COUNT);

  // let numOfBytesToPad = dataByteCount - (data.length % dataByteCount);
  // let paddString = '';
  // for (let i = 1; i <= numOfBytesToPad; i++) paddString += '1';
  // data = Buffer.concat([data, Buffer.from(paddString)]);
  const numBytes = data.length;
  const chunks = makeChunks(data, dataByteCount);

  console.log("Data will be uploaded over", chunks.length, "calls");

  const { feeCalculator } = await this.connection.getRecentBlockhash();
  const costOfAccountRent = await this.connection.getMinimumBalanceForRentExemption(
    numBytes
  );

  const costOfAccountTran = 2 * feeCalculator.lamportsPerSignature;
  let costOfAccountUpload = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkCost = 2 * feeCalculator.lamportsPerSignature; // two signers, the payer and the new account
    costOfAccountUpload += chunkCost;
  }

  const total = costOfAccountRent + costOfAccountTran + costOfAccountUpload;

  console.log(
    "EST FINAL TOTAL -- ",
    total,
    "lamports (",
    total / LAMPORTS_PER_SOL,
    ")"
  );

  let bal = await this.connection.getBalance(mainSystemAccountPubkey);

  if (bal < total) {
    console.error(
      "WARNING, your balance",
      bal,
      "is less than the estimate",
      total
    );
    return null;
  }

  function encodeData(type, fields) {
    const allocLength =
      type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
    const data = Buffer.alloc(allocLength);
    const layoutFields = Object.assign({ instruction: type.index }, fields);
    type.layout.encode(layoutFields, data);
    return data;
  }
  function getAlloc(type, fields) {
    let alloc = 0;
    type.layout.fields.forEach((item) => {
      if (item.span >= 0) {
        alloc += item.span;
      } else if (typeof item.alloc === "function") {
        alloc += item.alloc(fields[item.property]);
      }
    });
    return alloc;
  }

  
  await sleep(20000); //To make sure the above account is created before uploading data

  const balBeforeUpload = await this.connection.getBalance(mainSystemAccountPubkey);

  for (let i = 0; i < chunks.length; i++) {
    const data = chunks[i];
    const dataStructureU16 = BufferLayout.u16();
    let buffChunkNum = Buffer.alloc(CHUNKNUM_BYTE_COUNT);
    dataStructureU16.encode(i, buffChunkNum);

    let buffChunkSize = Buffer.alloc(CHUNKSIZE_BYTE_COUNT);
    dataStructureU16.encode(dataByteCount, buffChunkSize);

    let instruction_data = Buffer.concat([buffChunkNum, buffChunkSize, data]);
    let len = instruction_data.length;
    if (len < 512) {
      // Instruction data must be of 512 bytes so padding with null buffer
      let rem = 512 - len;
      let a = Buffer.from(new Array(rem).fill(0));
      instruction_data = Buffer.concat([instruction_data, a]);
    }
    const encodedTransactionInstruction = encodeData(
      TASK_INSTRUCTION_LAYOUTS.uploadDistributionList,

      {
        instruction_data: instruction_data,
      }
    );
    // console.log({ DATALENGTG: encodedTransactionInstruction.length });

    const balBeforeUploadChunk = await this.connection.getBalance(
      mainSystemAccountPubkey
    );

    const instruction = new TransactionInstruction({
        keys: [
          { pubkey: new  PublicKey("<TASK_PUBLICKEY>") /* */, isSigner: false, isWritable: false },
          { pubkey: distributionListAccount.publicKey, isSigner: true, isWritable: true },
          // { pubkey: uploadAccountPK, isSigner: true, isWritable: true },
        ], // add acc here after pk
        programId: new PublicKey(DATA_UPLOAD_PROGRAM_ID),
        data: encodedTransactionInstruction,
      });

    const transaction = new Transaction().add(instruction);
    await namespace.sendAndConfirmTransactionWrapper(transaction, [
      distributionListAccount
    ]);
    await sleep(100);
  }

  const balAfterUpload = await this.connection.getBalance(mainSystemAccountPubkey);
  const costOfUpload = balBeforeUpload - balAfterUpload;
  console.log(
    "Total cost was",
    costOfUpload,
    "lamports (",
    costOfUpload / LAMPORTS_PER_SOL,
    ")"
  );
  // TODO: Verify Retry Failed Transactions (logic changed)
 
  return distributionListAccount.publicKey;
}

// The function to send Account containing recipeints data to attention program


function makeChunks(data: Buffer, size: number): any[] {
  const numBytes = data.length;

  let numChunks = Math.ceil(numBytes / size);

  let c = [];

  let i = 0;
  for (; i < numChunks - 1; i++) {
    const sInd = i * size;
    const eInd = (i + 1) * size;
    c.push(data.slice(sInd, eInd));
  }
  c.push(data.slice(i * size, numBytes));

  return c;
}

const TASK_INSTRUCTION_LAYOUTS = Object.freeze({
  uploadDistributionList: {
    index: 11,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.blob(512, "instruction_data"),

      // publicKey('stake_pot_account')
    ]),
  },
});

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  