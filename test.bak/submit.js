const {
  SystemProgram,
  Account,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  BpfLoader,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
} =require( '@_koi/web3.js');

const BufferLayout =require( 'buffer-layout');

// const {sendAndConfirmTransaction,onTransaction} =require( './util/send-and-confirm-transaction';

const {getOurAccount} =require( './ourAccount');
const {getNodeConnection} =require( './nodeConnection');
const {getStore, setStore} =require( './storeConfig');

const fs =require( 'mz/fs');

const {sleep} =require( './sleep');
const {keyPress} =require( './keyPress');
const {makeChunks} =require( './chunks');

// work out how much upload data we can cram into every upload transaction

const SOLANA_TRAN_MAX_BYTES = 1232;

function getBytesRemaining() {
  const a = new Account();
  const pay = new Account();
  const prg = new Account();
  const i = new TransactionInstruction({
    keys: [{pubkey: a.publicKey, isSigner: true, isWritable: true}],
    programId: prg.publicKey,
    data: Buffer.alloc(0),
  });
  const dummy = new Transaction().add(i);
  dummy.recentBlockhash = '11111111111111111111111111111111';
  dummy.sign(pay, a);
  const s = dummy.serialize();
  console.log('SUCCESSFULLY SIGNED');
  return SOLANA_TRAN_MAX_BYTES - (s.length + 2); // don't know where the 2 extra bytes come from
}

const CHUNKNUM_BYTE_COUNT = 2; // u16 int, which chunk
const CHUNKSIZE_BYTE_COUNT = 2; // u16 int, how big are chunks

async function main() {
  const usage = function () {
    console.error('USAGE: npm run upload_file <pathToFile>');
  };

  let pathToFile = "./data.json";

  if (!pathToFile) {
    console.log('No file supplied');
    usage();
    process.exit(1);
  }

  try {
    if (fs.existsSync(pathToFile)) {
      //file exists
    }
  } catch (err) {
    console.error('File not found:', pathToFile, 'in', process.cwd());
    usage();
    process.exit(1);
  }

  const connection = await getNodeConnection();

  const ourAccount = await getOurAccount();
  // await setStore('upload.json', "8L223H74GyJu7RB3ChsAYCzTHnroQtCuQSLbwZU996JL")

  // const s = await getStore(connection, 'upload.json');

  // if (!s || !s.programId) {
  //   console.log('Deploy the program first');
  //   process.exit(1);
  // }

  console.log('ProgramId to use:', s.programId.toString());

  let data = await fs.readFile(pathToFile);

  console.log(pathToFile, 'contains', numBytes, 'bytes');

  // TODO: CHECK BYTES NOT EXCEED MAX

  // split our data across a number of calls

  const remainingByteCount = getBytesRemaining(s.programId);

  const dataByteCount = remainingByteCount - (CHUNKNUM_BYTE_COUNT + CHUNKSIZE_BYTE_COUNT);

  // TODO: Make the last chunk also take full space or cannot verify the last chunk

  console.log('DATA', data, data.length, dataByteCount);
  let numOfBytesToPad = dataByteCount - (data.length % dataByteCount);
  console.log(numOfBytesToPad);
  console.log('Max upload data per transaction:', remainingByteCount, 'without chunk index:', dataByteCount);
  // let paddString = '';
  // for (let i = 1; i <= numOfBytesToPad; i++) paddString += '1';
  // console.log(Buffer.from(paddString));
  // data = Buffer.concat([data, Buffer.from(paddString)]);
  console.log('DATA', data, data.length, dataByteCount);
  const numBytes = data.length;

  const chunks = makeChunks(data, dataByteCount);

  console.log('Data will be uploaded over', chunks.length, 'calls');
  // const ftype = (await FileType.fromBuffer(data)).ext;
  // const ftype="json"
  // console.log('File type:', ftype);

  const {feeCalculator} = await connection.getRecentBlockhash();

  console.log('COST ESTIMATION');

  const costOfAccountRent = await connection.getMinimumBalanceForRentExemption(numBytes);
  console.log('New Account -- rent exemption:', costOfAccountRent);

  const costOfAccountTran = 2 * feeCalculator.lamportsPerSignature;
  console.log('New Account -- transaction:', costOfAccountTran);

  console.log('New Account -- TOTAL:', costOfAccountRent + costOfAccountTran);

  let costOfAccountUpload = 0;

  console.log('Data Upload -- will require', chunks.length, 'calls');

  for (let i = 0; i < chunks.length; i++) {
    const chunkCost = 2 * feeCalculator.lamportsPerSignature; // two signers, the payer and the new account
    console.log('Upload Call', i, 'will upload', chunks[i].length, 'bytes, costing:', chunkCost);
    costOfAccountUpload += chunkCost;
  }

  console.log('Data Upload -- TOTAL:', costOfAccountUpload);

  const total = costOfAccountRent + costOfAccountTran + costOfAccountUpload;

  console.log('EST FINAL TOTAL -- ', total, 'lamports (', total / LAMPORTS_PER_SOL, ')');

  let bal = await connection.getBalance(ourAccount.publicKey);

  if (bal < total) {
    console.log('WARNING, your balance', bal, 'is less than the estimate', total);
  }

  console.log('Press any key to continue.');
  await keyPress();

  //++++++++++++++++
  // CREATE ACCOUNT
  //++++++++++++++++

  console.log('Creating account');

  let balBeforeAccount = await connection.getBalance(ourAccount.publicKey);

  const uploadAccount = new Keypair();
  const uploadAccountPK = uploadAccount.publicKey;

  const rentExemption = await connection.getMinimumBalanceForRentExemption(numBytes);

  const createTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: ourAccount.publicKey,
      newAccountPubkey: uploadAccount.publicKey,
      lamports: rentExemption,
      space: numBytes,
      programId: s.programId,
    })
  );
  console.log('TEST355');

  await sendAndConfirmTransaction(connection, createTransaction, [ourAccount, uploadAccount]);
  console.log('TEST3595');

  const balAfterAccount = await connection.getBalance(ourAccount.publicKey);

  const costAccount = balBeforeAccount - balAfterAccount;

  console.log(
    'Actual cost of making new account at:',
    uploadAccountPK.toString(),
    ' cost was:',
    costAccount,
    ' lamports (',
    costAccount / LAMPORTS_PER_SOL,
    ') Sol'
  );
  //++++++++++++++++
  // UPLOAD DATA
  //++++++++++++++++
  await sleep(20000); //To make sure the above account is created before uploading data
  console.log("Let's continue");

  const balBeforeUpload = await connection.getBalance(ourAccount.publicKey);

  for (let i = 0; i < chunks.length; i++) {
    //console.log('Press any key to load chunk',i)
    //await keyPress()

    const data = chunks[i];
    // Intentionally not sending the tx's below to imitate the tx failure
    // Uncomment to replicate tx failure of 2 and 6 tx
    // if (i == 2) continue;
    // if (i == 6) continue;

    const dataStructureU16 = BufferLayout.u16();
    let buffChunkNum = Buffer.alloc(CHUNKNUM_BYTE_COUNT);
    dataStructureU16.encode(i, buffChunkNum);

    let buffChunkSize = Buffer.alloc(CHUNKSIZE_BYTE_COUNT);
    dataStructureU16.encode(dataByteCount, buffChunkSize);

    const instruction_data = Buffer.concat([buffChunkNum, buffChunkSize, data]);

    const balBeforeUploadChunk = await connection.getBalance(ourAccount.publicKey);

    const instruction = new TransactionInstruction({
      keys: [{pubkey: uploadAccountPK, isSigner: true, isWritable: true}], // add acc here after pk
      programId: s.programId,
      data: instruction_data,
    });

    const transaction = new Transaction().add(instruction);
    transaction.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;

    transaction.sign(ourAccount, uploadAccount);
    const raw = transaction.serialize();

    let tSig;
    try {
      tSig = await connection.sendRawTransaction(raw);
    } catch (err) {
      console.log('Send failed:', err);
      process.exit(1);
    }

    //console.log("Transaction Signature:", tSig)

    const impatient = true;

    if (impatient) {
      // await sleep(1500);
      await sleep(10);
    } else {
      const tStatus = (
        await connection.confirmTransaction(
          tSig,
          //{ confirmations: 1 }, // https://solana-labs.github.io/solana-web3.js/typedef/index.html#static-typedef-Commitment
          {confirmations: 'singleGossip'}
        )
      ).value;

      if (tStatus) {
        if (tStatus.err) {
          console.log('Transaction failed:', tStatus.err);
          process.exit(1);
        }
      }
    }

    const balAfterUploadChunk = await connection.getBalance(ourAccount.publicKey);

    const costOfUploadChunk = balBeforeUploadChunk - balAfterUploadChunk;

    console.log('Cost of upload chunk', i, 'was', costOfUploadChunk, 'bytes in transaction:', raw.length);
  }

  const balAfterUpload = await connection.getBalance(ourAccount.publicKey);

  const costOfUpload = balBeforeUpload - balAfterUpload;

  console.log('Actual cost of full upload:', costOfUpload, 'lamports (', costOfUpload / LAMPORTS_PER_SOL, ')');

  const totalCost = costAccount + costOfUpload;

  console.log('Total cost was', totalCost, 'lamports (', totalCost / LAMPORTS_PER_SOL, ')');

  console.log('-----');

  await retryFailedTransactions(uploadAccountPK.toString(), dataByteCount, chunks, ourAccount, uploadAccount, s);
// console.log("WILL clean ")
//   await sleep(30000)


//   console.log("ccleaning account")
//   const dataStructureU16 = BufferLayout.u16();
//   let buffChunkNum = Buffer.alloc(CHUNKNUM_BYTE_COUNT);
//   dataStructureU16.encode(0, buffChunkNum);

//   let buffChunkSize = Buffer.alloc(CHUNKSIZE_BYTE_COUNT);
//   dataStructureU16.encode(0, buffChunkSize);

//   const instruction_data = Buffer.concat([buffChunkNum, buffChunkSize]);

//   const instruction = new TransactionInstruction({
//     keys: [{pubkey: uploadAccountPK, isSigner: true, isWritable: true}],
//     programId: s.programId,
//     data: instruction_data,
//   });

//   const transaction = new Transaction().add(instruction);
//   transaction.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;

//   transaction.sign(ourAccount, uploadAccount);
//   const raw = transaction.serialize();

//   let tSig;
//   try {
//     tSig = await connection.sendRawTransaction(raw);
//   } catch (err) {
//     console.log('Send failed:', err);
//     process.exit(1);
//   }

  // console.log("Cleared")
}
async function retryFailedTransactions(uploadAccountId, dataByteCount, chunks, ourAccount, uploadAccount, s) {
  console.log("Checking For Any Failed Tx's");
  await sleep(10000);
  // Each Account is intialized with 0's before we put the data into it
  // so, any large continous sequence of zeroes means that tx is missing
  const CONTINUOUS_ZEROES = dataByteCount * 2;
  const uploadAccountPK = uploadAccount.publicKey;

  let zeroString = '';
  for (let i = 1; i <= CONTINUOUS_ZEROES; i++) zeroString += '0';
  console.log(uploadAccountId);
  let pk = new PublicKey(uploadAccountId);

  const connection = await getNodeConnection();

  let account = await connection.getAccountInfo(pk);
  while (account.data.includes(zeroString, 0, 'hex')) {
    let index = account.data.indexOf(zeroString, 0, 'hex');
    console.log({index});
    if (index % dataByteCount == 0) {
      // Updating account.data for the exit condition in while loop
      let dummyBytes = Buffer.alloc(dataByteCount, '1');
      account.data = Buffer.concat([
        account.data.subarray(0, index),
        dummyBytes,
        account.data.subarray(index + dataByteCount, account.data.length),
      ]);

      // Continue retry logic
      let txFailedIndex = index / dataByteCount;
      console.log('Failed Tx ' + txFailedIndex + ' found - Retrying');
      const data = chunks[txFailedIndex];
      const dataStructureU16 = BufferLayout.u16();
      let buffChunkNum = Buffer.alloc(CHUNKNUM_BYTE_COUNT);
      dataStructureU16.encode(txFailedIndex, buffChunkNum);

      let buffChunkSize = Buffer.alloc(CHUNKSIZE_BYTE_COUNT);
      dataStructureU16.encode(dataByteCount, buffChunkSize);

      const instruction_data = Buffer.concat([buffChunkNum, buffChunkSize, data]);

      const instruction = new TransactionInstruction({
        keys: [{pubkey: uploadAccountPK, isSigner: true, isWritable: true}],
        programId: s.programId,
        data: instruction_data,
      });

      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;

      transaction.sign(ourAccount, uploadAccount);
      const raw = transaction.serialize();

      let tSig;
      try {
        tSig = await connection.sendRawTransaction(raw);
      } catch (err) {
        console.log('Send failed:', err);
        process.exit(1);
      }
      console.log(`Failed Tx ${txFailedIndex} sent again`);
    } else {
      // Can reach below only if data contains many zero bytes
      throw 'Something went wrong, Byte zero bytes found at middle of data(Not start of tx)';
    }
  }
  if (!account.data.includes(zeroString, 0, 'hex')) {
    console.log('FILE WAS UPLOADED SUCCESSFULLY');
  }
}

main()

  .catch((err) => {
    console.error(err);
  })
  .then(() => process.exit());
