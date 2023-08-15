import * as dotenv from "dotenv";
dotenv.config();
import {IConfig} from "../interfaces/config"

import { getConfig } from "./configHelper";

/**
 * Load and parse the Koii CLI config file to determine which RPC url to use
 */
export  function getRpcUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

    const config = getConfig() ;
    console.log("CONFIG", config);
    if (!config.json_rpc_url) throw new Error("Missing RPC URL");
    return config.json_rpc_url;
  } catch (err) {
    console.warn(
      "Failed to read RPC url from CLI config file, falling back to testnet"
    );
    return "https://k2-testnet.kobii.live";
  }
}
