/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import os from "os";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import * as dotenv from "dotenv";
import { IConfig } from "../interfaces/config";
dotenv.config();

/**
 * @private
 */
// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any
export async function getConfig(): Promise<IConfig> {
    // Path to KOII CLI config file
    const CONFIG_FILE_PATH = path.resolve(
      os.homedir(),
      ".config",
      "koii",
      "cli",
      "config.yml"
    );
    let configYml;
    try {
      configYml = fs.readFileSync(CONFIG_FILE_PATH, { encoding: "utf8" });
    } catch (e) {
      console.log(
        "KOII CLI not installed or configured properly. Please follow these docs: https://docs.koii.network/quickstart/command-line-tool/koii-cli/install-cli"
      );
      return process.exit(1);
  
    }
    return yaml.parse(configYml);
  }