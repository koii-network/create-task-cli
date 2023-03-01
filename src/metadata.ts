/**
 * Hello world
 */

import { establishConnection } from "./task_contract";
import prompts from "prompts";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@_koi/web3.js";
import fs, { existsSync } from "fs";
import { config } from "dotenv";
import { tmpdir } from "os";
import { join } from "path";
import { Web3Storage, getFilesFromPath } from "web3.storage";
config();
let web3Key: string | null;

// interface TaskMetadata {
//     author: string;
//     description: string;
//     repositoryUrl: string;
//     createdAt: number;
//     imageUrl: string;
//     requirementsTags: RequirementTag[];
//   }

// interface RequirementTag {
//     type: RequirementType;
//     value?: string | string[]; // defined if given requirement needs a specific value
//     description?: string;
//   }

//   enum RequirementType {
//     GLOBAL_VARIABLE = 'GLOBAL_VARIABLE',
//     TASK_VARIABLE = 'TASK_VARIABLE',
//     CPU = 'CPU',
//     RAM = 'RAM',
//     STORAGE = 'STORAGE',
//     NETWORK = 'NETWORK',
//     ARCHITECTURE = 'ARCHITECTURE',
//     OS = 'OS',
//   }

// async function addRequirementType(requirementsTagsObject:RequirementTag){

// }

async function takeInputForRequirementTypes() {
  let value = (
    await prompts({
      type: "text",
      name: "value",
      message: "Enter the value",
    })
  ).value;

  let description = (
    await prompts({
      type: "text",
      name: "description",
      message: "Enter the description",
    })
  ).description;

  return { value, description };
}

async function main() {
  web3Key = process.env["web3_key"] || null;
  if (!web3Key) {
    while (!web3Key)
      web3Key = (
        await prompts({
          type: "text",
          name: "web3Key",
          message: "Enter your WEB3 Access Key",
          validate: (value) =>
            value ? true : "Please Enter a valid WEB3 Access key",
        })
      ).web3Key;
  }
  await takeInputForMetadata();
}

async function takeInputForMetadata() {
  let metadata: any = {
    author: "",
    description: "",
    repositoryUrl: "",
    createdAt: "",
    imageURL: "",
    requirementsTags: [],
  };

  metadata.author = (
    await prompts({
      type: "text",
      name: "author",
      message: "Enter the name of the task Author",
    })
  ).author;
  metadata.description = (
    await prompts({
      type: "text",
      name: "description",
      message: "Enter the task description",
    })
  ).description;
  metadata.repositoryUrl = (
    await prompts({
      type: "text",
      name: "repositoryUrl",
      message: "Enter the task repository URL",
    })
  ).repositoryUrl;
  metadata.imageURL = (
    await prompts({
      type: "text",
      name: "imageURL",
      message: "Enter the task Image URL",
    })
  ).imageURL;

  let response = (
    await prompts({
      type: "confirm",
      name: "response",
      message: `Do you wish to add other requirement types`,
    })
  ).response;

  while (response) {
    const mode = (
      await prompts({
        type: "select",
        name: "mode",
        message: "Select field",

        choices: [
          { title: "GLOBAL_VARIABLE", value: "global-varibale" },
          { title: "TASK_VARIABLE", value: "task-variable" },
          { title: "CPU", value: "cpu" },
          { title: "RAM", value: "ram" },
          { title: "STORAGE", value: "storage" },
          { title: "NETWORK", value: "network" },
          { title: "ARCHITECTURE", value: "architecture" },
          { title: "OS", value: "os" },
        ],
      })
    ).mode;
    console.log(mode);

    const { value, description } = await takeInputForRequirementTypes();
    const requirementTag = {
      type: mode,
      value: value,
      description: description,
    };
    metadata.requirementsTags.push(requirementTag);

    response = (
      await prompts({
        type: "confirm",
        name: "response",
        message: `Do you wish to add other requirement types`,
      })
    ).response;
  }

  console.log(metadata);
  let tmp = tmpdir();
  let metadataPath = join(tmp, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  const storageClient = new Web3Storage({ token: web3Key as string });
  let upload = await getFilesFromPath([metadataPath]);
  let result = await storageClient.put(upload);
  console.log(
    "\x1b[1m\x1b[32m%s\x1b[0m",
    `Your MetaData CID is ${result}/metadata.json`
  );
}

export default main;
