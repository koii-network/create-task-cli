import { Connection } from "@_koi/web3.js";
import { getRpcUrl } from "./RPCHelper";
let connection: Connection;
export async function establishConnection(): Promise<Connection> {
  if (connection) {
    return connection;
  }
  const rpcUrl = getRpcUrl();
  connection = new Connection(rpcUrl, "confirmed");
  const version = await connection.getVersion();
  console.log("Connection to cluster established:", rpcUrl, version);
  return connection;
}
