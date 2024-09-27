import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, getMint } from "@solana/spl-token";

async function getKPLDigits(
    mint_address: PublicKey,
    connection: Connection,
  ) {
    const mintInfo = await getMint(connection, mint_address);
    const decimals = mintInfo.decimals;
    return decimals;
  }
async function getTokenBalance(connection: Connection, payerWallet: Keypair,  tokenMintAddress: string) {

    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payerWallet, new PublicKey(tokenMintAddress), payerWallet.publicKey);
    const amount = associatedTokenAccount.amount;
    const digits = await getKPLDigits(associatedTokenAccount.mint, connection);
    const balance: bigint = amount / BigInt(digits);
    const balanceAsNumber = Number(balance)
    return balanceAsNumber;
}

export default getTokenBalance;