import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  SYSVAR_CLOCK_PUBKEY,
  SystemProgram,
} from '@_koii/web3.js';
import { KPLProgramID } from '../constant';


export async function createStakingAccount(
  connection: Connection,
  payerWallet: Keypair,
): Promise<Keypair> {
  const stakingAccKeypair = new Keypair();
  const createSubmitterAccTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: stakingAccKeypair.publicKey,
      lamports: 0.01 * LAMPORTS_PER_SOL,
      space: 10,
      programId: new PublicKey(KPLProgramID),
    }),
  );
  await sendAndConfirmTransaction(connection, createSubmitterAccTransaction, [
    payerWallet,
    stakingAccKeypair,
  ]);
  return stakingAccKeypair;
}
