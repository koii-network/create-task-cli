const { Connection, PublicKey,Keypair } = require("@_koi/web3.js");
const fs = require("fs");
payerWallet = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(
      fs.readFileSync("./taskStateInfoKeypair.json", { encoding: "utf-8" })
    )
  )
);
// console.log(JSON.parse(
//     fs.readFileSync("../taskStateInfoKeypair.json", { encoding: "utf-8" })
//   ))
async function main() {
  const connection = new Connection("http://localhost:8899");
  const accountInfo = await connection.getAccountInfo(
    payerWallet.publicKey
  );
  console.log(payerWallet.publicKey.toBase58())
  console.log(accountInfo.data+"")
  console.log(JSON.parse(accountInfo.data + ""));
}

main()
