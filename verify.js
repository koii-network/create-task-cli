const os = require("os");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");
const { Keypair,PublicKey } = require("@_koi/web3.js");

// eslint-disable-next-line @typescript-eslint/require-await
// function createKeypairFromFile(filePath) {
//   const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
//   return secretKeyString;
//   const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
//   return Keypair.fromSecretKey(secretKey);
// }

// // console.log(createKeypairFromFile("./taskStateInfoKeypair.json"))
// // console.log(new Keypair());
// new PublicKey(
//   new Uint8Array([
//     191, 110, 111, 190, 137, 214, 181, 174, 125, 174, 147, 153, 51, 29, 25, 221,
//     47, 40, 129, 233, 193, 68, 7, 222, 23, 91, 189, 133, 139, 86, 1, 31,
//   ])
// ).toString();

// console.log(
//   new PublicKey(
//     new Uint8Array([
//       191, 110, 111, 190, 137, 214, 181, 174, 125, 174, 147, 153, 51, 29, 25,
//       221, 47, 40, 129, 233, 193, 68, 7, 222, 23, 91, 189, 133, 139, 86, 1, 31,
//     ])
//   ).toString()
// );
 function createKeypairFromFile(filePath){
  const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
  console.log(secretKeyString);
  const secretKey = Uint8Array.from(
    JSON.parse(secretKeyString)
  );
  return Keypair.fromSecretKey(secretKey);
}

console.log(createKeypairFromFile("taskStateInfoKeypair.json"))