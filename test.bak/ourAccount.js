const { Account } = require("@solana/web3.js");
const fs = require("mz/fs");
const { Keypair } = require("@solana/web3.js");

export async function getOurAccount() {
  const keypairFile = "./keypair.json";

  if (!fs.existsSync(keypairFile)) {
    console.log("The expected keypair file", keypairFile, "was not found");
    process.exit(1);
  }
  const secretKeyString = await fs.readFile(keypairFile, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
  // const secret = JSON.parse( await fs.readFile( keypairFile ))
  // const account = new Account( secret )

  // console.log('Our account:', account.publicKey.toBase58())

  // return account
}
