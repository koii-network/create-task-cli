import {
  Keypair,
} from "@_koi/web3.js";
import { getConfig } from "./configHelper";
import { createKeypairFromFile } from "./getWalletFromFile";
export function getPayer(): Keypair {
  try {
    const config = getConfig();
    if (!config.keypair_path) throw new Error("Missing keypair path");
    return createKeypairFromFile(config.keypair_path);
  } catch (err) {
    console.warn(
      "Failed to create keypair from CLI config file, falling back to new random keypair"
    );
    return Keypair.generate();
  }
}
