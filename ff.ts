import { Connection, Keypair, PublicKey } from "@_koi/web3.js";

let connection: Connection = new Connection("http://localhost:8899");
export async function hello() {
//   console.log(connection.getAccountInfo);
  // console.log(connection.getAccountInfo(new Keypair().publicKey))'

  const programId = new PublicKey(
    "Koiitask22222222222222222222222222222222222"
  );
  connection.getAccountInfo(programId).then((info) => {
    console.log(info);
  });
}
export async function hi() {
//   console.log(connection.getAccountInfo);
  // console.log(connection.getAccountInfo(new Keypair().publicKey))'

  const programId = new PublicKey(
    "Koiitask22222222222222222222222222222222222"
  );
  connection.getAccountInfo(programId).then((info) => {
    console.log(info);
  });
}
