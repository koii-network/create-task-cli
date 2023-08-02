import { Keypair } from "@_koi/web3.js";
import fs from "fs";


export function createKeypairFromFile(filePath: string): Keypair {
  const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
  console.log(secretKeyString,"33");
  const secretKey = Uint8Array.from(
    JSON.parse(secretKeyString) as Array<number>
  );
  return Keypair.fromSecretKey(secretKey);
}


