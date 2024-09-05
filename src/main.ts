#!/usr/bin/env node

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  updateTask,
  Whitelist,
  SetActive,
  ClaimReward,
  FundTask,
  Withdraw,
  handleManagerAccounts,
  DeleteTask,
} from "./task_contract";
import { establishConnection as KPLEstablishConnection, establishPayer as KPLEstablishPayer, checkProgram as KPLCheckProgram, Whitelist as KPLWhitelist, handleManagerAccounts as KPLHandleManagerAccounts, Blacklist as KPLBlacklist } from "./kpl_task_contract/task-program";
import { uploadIpfs } from "./utils";
import { Keypair as SolanaKeypair, PublicKey as SolanaPublickey } from "@solana/web3.js";
import prompts from "prompts";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@_koii/web3.js";
import fs from "fs";
import { config } from "dotenv";
import handleMetadata from "./metadata";
import { join } from "path";
import { tmpdir } from "os";
import { Web3Storage, getFilesFromPath } from "web3.storage";
import { KPLDeleteTask } from "./export";
config();
let ISKPLTask:string;
async function checkIsKPLTask(){
  ISKPLTask = (
    await prompts({
      type: "select",
      name: "kpltask",
      message: "Select operation",
  
      choices: [
        { title: "KOII-Task", value: "no" },
        { title: "KPL-Task", value: "yes" },
      ],
    })
  ).kpltask;
  console.log("ISKPLTask", ISKPLTask);
}
async function main() {
  let payerWallet: Keypair;
  let walletPath: string = "./id.json";

  // walletPath = (
  //   await prompts({
  //     type: 'text',
  //     name: 'wallet',
  //     message: 'Enter the path to your wallet',
  //   })
  // ).wallet;
  //console.log(walletPath);
  if (!fs.existsSync(walletPath))
    throw Error(
      "Please make sure that wallet is under the name id.json and  in the current directory"
    );

  try {
    let wallet = fs.readFileSync(walletPath, "utf-8");
    payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet)));
  } catch (e) {
    console.error("Wallet Doesn't Exist");
    process.exit();
  }

  const mode = (
    await prompts({
      type: "select",
      name: "mode",
      message: "Select operation",

      choices: [
        { title: "Create a new task", value: "create-task" },
        { title: "Whitelist the task", value: "whitelisting" },
        { title: "Blacklist the task", value: "blacklisting" },
        { title: "Deleting the task", value: "delete-task" },
        { title: "Activate task", value: "set-active" },
        { title: "Claim reward", value: "claim-reward" },
        { title: "Fund task with more KOII", value: "fund-task" },
        { title: "Withdraw staked funds from task", value: "withdraw" },
        {
          title: "upload assets to IPFS(metadata/local vars)",
          value: "handle-assets",
        },
        {
          title: "Handle manager accounts on k2",
          value: "handle-manager-accounts",
        },
      ],
    })
  ).mode;
  console.log(mode);
  // Establish connection to the cluster
  const connection = await establishConnection();
  await KPLEstablishConnection();
  
  // Determine who pays for the fees
  await establishPayer(payerWallet);
  await KPLEstablishPayer(payerWallet as unknown as SolanaKeypair);
  // Check if the program has been deployed
  await checkProgram();
  await KPLCheckProgram();
  switch (mode) {
    case "create-task": {
      const taskMode = (
        await prompts({
          type: "select",
          name: "mode",
          message: "Select operation",

          choices: [
            { title: "using CLI", value: "create-task-cli" },
            { title: "using config YML", value: "create-task-yml" },
          ],
        })
      ).mode;
      console.log(taskMode);

      switch (taskMode) {
        case "create-task-cli": {
          const {
            task_name,
            task_audit_program_id,
            total_bounty_amount,
            bounty_amount_per_round,
            space,
            task_description,
            task_executable_network,
            round_time,
            audit_window,
            submission_window,
            minimum_stake_amount,
            task_metadata,
            task_locals,
            koii_vars,
            allowed_failed_distributions,
          } = await takeInputForCreateTask();
          // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
          let totalAmount =
            LAMPORTS_PER_SOL * total_bounty_amount +
            (await connection.getMinimumBalanceForRentExemption(100)) +
            10000 +
            (await connection.getMinimumBalanceForRentExemption(space)) +
            10000;
          let response = (
            await prompts({
              type: "confirm",
              name: "response",
              message: `Your account will be subtract ${
                totalAmount / LAMPORTS_PER_SOL
              } KOII for creating the task, which includes the rent exemption and bounty amount fees`,
            })
          ).response;

          if (!response) process.exit(0);
          let lamports = await connection.getBalance(payerWallet.publicKey);
          if (lamports < totalAmount) {
            console.error("Insufficient balance for this operation");
            process.exit(0);
          }
          console.log("Calling Create Task");
          // TODO: All params for the createTask should be accepted from cli input and should be replaced in the function below
          let { taskStateInfoKeypair, stake_pot_account_pubkey } =
            await createTask(
              payerWallet,
              task_name,
              task_audit_program_id,
              total_bounty_amount,
              bounty_amount_per_round,
              space,
              task_description,
              task_executable_network,
              round_time,
              audit_window,
              submission_window,
              minimum_stake_amount,
              task_metadata,
              task_locals,
              koii_vars,
              allowed_failed_distributions
            );
          fs.writeFileSync(
            "taskStateInfoKeypair.json",
            JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
          );
          console.log("Task Id:", taskStateInfoKeypair.publicKey.toBase58());
          console.log(
            "Stake Pot Account Pubkey:",
            stake_pot_account_pubkey.toBase58()
          );
          console.log(
            "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
          );
          break;
        }

        case "create-task-yml": {
          const readYamlFile = require("read-yaml-file");
          let metaDataCid: string;
          let task_audit_program_id: string;

          let ymlPath: string = "./config-task.yml";

          if (!fs.existsSync(ymlPath))
            throw Error(
              "Please make sure that your  configuration file is under the name config-task.yml and  in the current directory"
            );

          await readYamlFile("config-task.yml").then(async (data: any) => {
            console.log("CHECK", data.secret_web3_storage_key);

            interface TaskMetadata {
              author: string;
              description: string;
              repositoryUrl: string;
              createdAt: number;
              imageUrl: string;
              requirementsTags: RequirementTag[];
            }

            interface RequirementTag {
              type: RequirementType;
              value?: string | string[]; // defined if given requirement needs a specific value
              description?: string;
            }

            enum RequirementType {
              GLOBAL_VARIABLE = "GLOBAL_VARIABLE",
              TASK_VARIABLE = "TASK_VARIABLE",
              CPU = "CPU",
              RAM = "RAM",
              STORAGE = "STORAGE",
              NETWORK = "NETWORK",
              ARCHITECTURE = "ARCHITECTURE",
              OS = "OS",
            }

            if (data.task_executable_network == "IPFS") {
              task_audit_program_id = await uploadIpfs(
                data.task_audit_program,
                data.secret_web3_storage_key
              );
              console.log("TASK CID", task_audit_program_id);
            } else if (
              data.task_executable_network == "ARWEAVE" ||
              "DEVELOPMENT"
            ) {
              task_audit_program_id = data.task_audit_program_id;
            } else {
              console.error(
                "Please specify the task_executable_network in YML"
              );
              process.exit();
            }

            // Before passing it to TaskMetadata validate the input

            const metaData: TaskMetadata = {
              author: data.author,
              description: data.description,
              repositoryUrl: data.repositoryUrl,
              createdAt: data.createdAt,
              imageUrl: data.imageUrl,
              requirementsTags: data.requirementsTags,
            };

            // for (const [key, value] of Object.entries(metaData)) {
            //   //console.log(value.length);
            //   if (value == undefined || value == "" || value == null) {
            //     console.error(`Please specify ${key} in YML`);
            //     process.exit();
            //   }
            //   else if(){

            //   }
            // }

            console.log("METADATA", metaData);
            let tmp = tmpdir();
            let metadataPath = join(tmp, "metadata.json");
            fs.writeFileSync(metadataPath, JSON.stringify(metaData));
            const storageClient = new Web3Storage({
              token: data.secret_web3_storage_key as string,
            });
            let upload: any = await getFilesFromPath([metadataPath]);
            try {
              metaDataCid = await storageClient.put(upload);
            } catch (err) {
              console.error(
                "IPFS upload failed, please check your web3.storage key"
              );
              process.exit();
            }
            console.log(
              "\x1b[1m\x1b[32m%s\x1b[0m",
              `Your MetaData CID is ${metaDataCid}/metadata.json`
            );

            // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
            let totalAmount =
              LAMPORTS_PER_SOL * data.total_bounty_amount +
              (await connection.getMinimumBalanceForRentExemption(100)) +
              10000 +
              (await connection.getMinimumBalanceForRentExemption(data.space)) +
              10000;
            let response = (
              await prompts({
                type: "confirm",
                name: "response",
                message: `Your account will be subtract ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for creating the task, which includes the rent exemption and bounty amount fees`,
              })
            ).response;

            if (!response) process.exit(0);
            let lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.error("Insufficient balance for this operation");
              process.exit(0);
            }
            console.log("Calling Create Task");
            // Before passing it to createTask validate the inputs
            let { taskStateInfoKeypair, stake_pot_account_pubkey } =
              await createTask(
                payerWallet,
                data.task_name,
                task_audit_program_id,
                data.total_bounty_amount,
                data.bounty_amount_per_round,
                data.space,
                data.task_description,
                data.task_executable_network,
                data.round_time,
                data.audit_window,
                data.submission_window,
                data.minimum_stake_amount,
                metaDataCid,
                "",
                "",
                Number(data.allowed_failed_distributions)
              );
            fs.writeFileSync(
              "taskStateInfoKeypair.json",
              JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
            );
            console.log("Task Id:", taskStateInfoKeypair.publicKey.toBase58());
            console.log(
              "Stake Pot Account Pubkey:",
              stake_pot_account_pubkey.toBase58()
            );
            console.log(
              "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
            );
          });
          break;
        }
      }
      break;
    }
    case "whitelisting": {
      await checkIsKPLTask();
      const { programOwnerAddress, taskStateInfoAddress } =
        await takeInputForWhitelisting();
      console.log("Calling Whitelist");
      if (ISKPLTask == "yes") {
        console.log(payerWallet);
        await KPLWhitelist(
          taskStateInfoAddress as unknown as SolanaPublickey,
          programOwnerAddress,
        );
      }else{
      await Whitelist(
        payerWallet,
        taskStateInfoAddress,
        programOwnerAddress,
        true
      );
    }
      break;
    }
    case "blacklisting": {
      await checkIsKPLTask();
      const { programOwnerAddress, taskStateInfoAddress } =
        await takeInputForWhitelisting();
      console.log("Calling blacklisting");
      if (ISKPLTask == "yes") {
        console.log(payerWallet);
        await KPLBlacklist(
          taskStateInfoAddress as unknown as SolanaPublickey,
          programOwnerAddress,
    
        );
      }else{
      await Whitelist(
        payerWallet,
        taskStateInfoAddress,
        programOwnerAddress,
        false
      );
    }
      break;
    }
    case "delete-task": {
      const { stakePotAccount, programOwnerAddress, taskStateInfoAddress } = await takeInputForDeleteTask();
      await checkIsKPLTask();
      if (ISKPLTask == "yes") {
        let mint = (
          await prompts({
            type: "text",
            name: "mint",
            message: "Enter mint address",
          })
        ).mint;        
        await KPLDeleteTask(payerWallet as unknown as SolanaKeypair, taskStateInfoAddress as unknown as SolanaPublickey, programOwnerAddress, stakePotAccount as unknown as SolanaPublickey, mint);
      }else{
      await DeleteTask(payerWallet,
      taskStateInfoAddress,
      programOwnerAddress,
      stakePotAccount
      )
    }
      break;
    }
    case "set-active": {
      console.log("Calling SetActive");
      const { isActive, taskStateInfoAddress } = await takeInputForSetActive();
      await SetActive(payerWallet, taskStateInfoAddress, isActive);
      break;
    }
    case "claim-reward": {
      console.log("Calling ClaimReward");
      const {
        beneficiaryAccount,
        stakePotAccount,
        taskStateInfoAddress,
        claimerKeypair,
      } = await takeInputForClaimReward();
      await ClaimReward(
        payerWallet,
        taskStateInfoAddress,
        stakePotAccount,
        beneficiaryAccount,
        claimerKeypair
      );
      break;
    }
    case "fund-task": {
      console.log("Calling FundTask");
      const { stakePotAccount, taskStateInfoAddress, amount } =
        await takeInputForFundTask();
      await FundTask(
        payerWallet,
        taskStateInfoAddress,
        stakePotAccount,
        amount
      );
      break;
    }
    case "withdraw": {
      console.log("Calling Withdraw");
      const { taskStateInfoAddress, submitterKeypair } =
        await takeInputForWithdraw();
      await Withdraw(payerWallet, taskStateInfoAddress, submitterKeypair);
      break;
    }
    case "handle-assets": {
      await handleMetadata();
      break;
    }
    case "handle-assets": {
      await handleMetadata();
      break;
    }
    case "update-task": {
      let taskId = (
        await prompts({
          type: "text",
          name: "taskId",
          message: "Enter id of the task you want to edit",
        })
      ).taskId;

      const accountInfo = await connection.getAccountInfo(
        new PublicKey(taskId)
      );
      if (accountInfo == null) {
        console.log("No task found with this Id");
        break;
      }
      let rawData = accountInfo.data + "";
      let state = JSON.parse(rawData);
      console.log(state);
      if (
        new PublicKey(state.task_manager).toString() !==
        payerWallet.publicKey.toString()
      ) {
        console.log("You are not the owner of this task! ");
        break;
      }
      const taskAccountInfoPubKey = new PublicKey(taskId);
      console.log("OLD TASK STATE INFO", taskAccountInfoPubKey);
      const statePotAccount = new PublicKey(state.stake_pot_account);
      console.log("OLD STATE POT", statePotAccount);
      const {
        task_name,
        task_audit_program_id,
        total_bounty_amount,
        bounty_amount_per_round,
        space,
        task_description,
        task_executable_network,
        round_time,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        task_locals,
        allowed_failed_distributions,
      } = await takeInputForCreateTask(state);
      // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
      let totalAmount =
        LAMPORTS_PER_SOL * total_bounty_amount +
        (await connection.getMinimumBalanceForRentExemption(100)) +
        10000 +
        (await connection.getMinimumBalanceForRentExemption(space)) +
        10000;
      let response = (
        await prompts({
          type: "confirm",
          name: "response",
          message: `Your account will be subtract ${
            totalAmount / LAMPORTS_PER_SOL
          } KOII for creating the task, which includes the rent exemption and bounty amount fees`,
        })
      ).response;

      if (!response) process.exit(0);
      let lamports = await connection.getBalance(payerWallet.publicKey);
      if (lamports < totalAmount) {
        console.error("Insufficient balance for this operation");
        process.exit(0);
      }
      console.log("Calling Update Task");

      // TODO: All params for the createTask should be accepted from cli input and should be replaced in the function below

      let { taskStateInfoKeypair, stake_pot_account_pubkey } = await updateTask(
        payerWallet,
        task_name,
        task_audit_program_id,
        bounty_amount_per_round,
        space,
        task_description,
        task_executable_network,
        round_time,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        task_locals,
        allowed_failed_distributions,
        taskAccountInfoPubKey,
        statePotAccount
      );
      fs.writeFileSync(
        "taskStateInfoKeypair.json",
        JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
      );
      console.log("Task Id:", taskStateInfoKeypair.publicKey.toBase58());
      console.log(
        "Stake Pot Account Pubkey:",
        stake_pot_account_pubkey.toBase58()
      );
      console.log(
        "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
      );
      break;
    }
    case "handle-manager-accounts": {
      checkIsKPLTask();
      console.log("Calling handleManagerAccounts");
      const { operation, signer1, signer2, insertOrDeleteAccount } =
        await takeInputForHandleManagerAccounts();
      if (ISKPLTask == "yes") {
        await KPLHandleManagerAccounts(
          payerWallet as unknown as SolanaKeypair,
          operation,
          signer1 as unknown as SolanaKeypair,
          signer2 as unknown as SolanaKeypair,
          insertOrDeleteAccount as unknown as SolanaPublickey
        );
      } else{
      await handleManagerAccounts(
        payerWallet,
        operation,
        signer1,
        signer2,
        insertOrDeleteAccount
      );
    }
      break;
    }
    default:
      console.error("Invalid option selected");
  }
  console.log("Success");
}

async function takeInputForCreateTask(state?: any) {
  let task_name = (
    await prompts({
      type: "text",
      name: "task_name",
      message: "Enter the name of the task",
    })
  ).task_name;
  while (task_name.length > 24) {
    console.error("The task name cannot be greater than 24 characters");
    task_name = (
      await prompts({
        type: "text",
        name: "task_name",
        message: "Enter the name of the task",
        initial: state?.name || null,
      })
    ).task_name;
  }
  let task_description = (
    await prompts({
      type: "text",
      name: "task_description",
      message: "Enter a short description of your task",
    })
  ).task_description;
  while (task_description.length > 100) {
    console.error(
      "The task_description length cannot be greater than 100 characters"
    );
    task_description = (
      await prompts({
        type: "text",
        name: "task_description",
        message: "Enter a short description of your task",
      })
    ).task_description;
  }

  let task_executable_network = (
    await prompts({
      type: "text",
      name: "task_executable_network",
      message:
        "Enter the network to be used to upload your executable [IPFS / ARWEAVE / DEVELOPMENT]",
    })
  ).task_executable_network;
  while (task_executable_network.length > 100) {
    console.error(
      "The task_executable_network length cannot be greater than 100 characters"
    );
    task_executable_network = (
      await prompts({
        type: "text",
        name: "task_executable_network",
        message:
          "Enter the network to be used to upload your executable [IPFS / ARWEAVE / DEVELOPMENT]",
      })
    ).task_executable_network;
  }
  while (
    task_executable_network != "IPFS" &&
    task_executable_network != "ARWEAVE" &&
    task_executable_network != "DEVELOPMENT"
  ) {
    console.error(
      "The task_executable_network can only be IPFS , ARWEAVE  or DEVELOPMENT"
    );
    task_executable_network = (
      await prompts({
        type: "text",
        name: "task_executable_network",
        message:
          "Enter the network to be used to upload your executable [IPFS / ARWEAVE / DEVELOPMENT]",
      })
    ).task_executable_network;
  }
  let secret_web3_storage_key;
  let task_audit_program;
  let task_audit_program_id;
  if (task_executable_network == "IPFS") {
    secret_web3_storage_key = (
      await prompts({
        type: "text",
        name: "secret_web3_storage_key",
        message: "Enter the web3.storage API key",
      })
    ).secret_web3_storage_key;
    while (secret_web3_storage_key < 200) {
      console.error(
        "secret_web3_storage_key cannot be less than 200 characters"
      );
      secret_web3_storage_key = (
        await prompts({
          type: "text",
          name: "secret_web3_storage_key",
          message: "Enter the web3.storage API key",
        })
      ).secret_web3_storage_key;
    }
    task_audit_program = (
      await prompts({
        type: "text",
        name: "task_audit_program",
        message: "Enter the path to your executable webpack",
      })
    ).task_audit_program;
    while (task_audit_program.length > 200) {
      console.error(
        "The task audit program length cannot be greater than 200 characters"
      );
      task_audit_program = (
        await prompts({
          type: "text",
          name: "task_audit_program",
          message: "Enter the path to your executable webpack",
        })
      ).task_audit_program;
    }
    task_audit_program_id = await uploadIpfs(
      task_audit_program,
      secret_web3_storage_key
    );
    //console.log("CID OUTSIDE LOOP", cid);
    while (task_audit_program_id == "File not found") {
      task_audit_program = (
        await prompts({
          type: "text",
          name: "task_audit_program",
          message: "Enter the path to your executable webpack",
        })
      ).task_audit_program;
      task_audit_program_id = await uploadIpfs(
        task_audit_program,
        secret_web3_storage_key
      );
      //console.log("CID VALUE",task_audit_program_id);
    }
  } else if (task_executable_network == "ARWEAVE") {
    task_audit_program_id = (
      await prompts({
        type: "text",
        name: "task_audit_program_id",
        message:
          "Enter Arweave id of the deployed koii task executable program",
      })
    ).task_audit_program_id;
    while (task_audit_program_id.length > 64) {
      console.error(
        "The task audit program length cannot be greater than 64 characters"
      );
      task_audit_program_id = (
        await prompts({
          type: "text",
          name: "task_audit_program_id",
          message:
            "Enter Arweave id of the deployed koii task executable program",
        })
      ).task_audit_program_id;
    }
  } else {
    task_audit_program_id = (
      await prompts({
        type: "text",
        name: "task_audit_program_id",
        message: "Enter the name of executable you want to run on  task-nodes",
      })
    ).task_audit_program_id;
    while (task_audit_program_id.length > 64) {
      console.error(
        "The task audit program length cannot be greater than 64 characters"
      );
      task_audit_program_id = (
        await prompts({
          type: "text",
          name: "task_audit_program_id",
          message:
            "Enter the name of executable you want to run on  task-nodes",
        })
      ).task_audit_program_id;
    }
  }
  let round_time = (
    await prompts({
      type: "number",
      name: "round_time",
      message: "Enter the round time in slots",
    })
  ).round_time;
  let audit_window = (
    await prompts({
      type: "number",
      name: "audit_window",
      message: "Enter the audit window in slots",
    })
  ).audit_window;
  let submission_window = (
    await prompts({
      type: "number",
      name: "submission_window",
      message: "Enter the submission window in slots",
    })
  ).submission_window;
  let minimum_stake_amount = (
    await prompts({
      type: "number",
      name: "minimum_stake_amount",
      message: "Enter the minimum staking amount for the task (in KOII)",
      float: true,
    })
  ).minimum_stake_amount;
  let total_bounty_amount = (
    await prompts({
      type: "number",
      name: "total_bounty_amount",
      message:
        "Enter the total bounty you want to allocate for the task (In KOII)",
    })
  ).total_bounty_amount;
  while (total_bounty_amount < 10) {
    console.error("The total_bounty_amount cannot be less than 10");
    total_bounty_amount = (
      await prompts({
        type: "number",
        name: "total_bounty_amount",
        message:
          "Enter the total bounty you want to allocate for the task (In KOII)",
      })
    ).total_bounty_amount;
  }
  let bounty_amount_per_round = (
    await prompts({
      type: "number",
      name: "bounty_amount_per_round",
      message: "Enter the bounty amount per round (In KOII)",
      // max: total_bounty_amount,
    })
  ).bounty_amount_per_round;
  let allowed_failed_distributions = (
    await prompts({
      type: "number",
      name: "allowed_failed_distributions",
      message:
        "Enter the number of distribution list submission retry in case it fails",
    })
  ).allowed_failed_distributions;
  while (allowed_failed_distributions < 0) {
    console.error("failed distributions cannot be less than 0");
    allowed_failed_distributions = (
      await prompts({
        type: "number",
        name: "allowed_failed_distributions",
        message:
          "Enter the number of distribution list submission retry in case it fails",
      })
    ).allowed_failed_distributions;
  }

  let task_metadata = (
    await prompts({
      type: "text",
      name: "task_metadata",
      message: `Enter TaskMetadata CID hosted on ${"IPFS"} (Leave empty for None).`,
    })
  ).task_metadata;
  let task_locals = (
    await prompts({
      type: "text",
      name: "task_locals",
      message: `Enter CID for environment variables hosted on ${"IPFS"} (Leave empty for None).`,
    })
  ).task_locals;
  let koii_vars = (
    await prompts({
      type: "text",
      name: "koii_vars",
      message: `Enter PubKey for KOII global vars.(Leave empty for default) `,
    })
  ).koii_vars;

  while (bounty_amount_per_round > total_bounty_amount) {
    console.error(
      "The bounty_amount_per_round cannot be greater than total_bounty_amount"
    );
    bounty_amount_per_round = (
      await prompts({
        type: "number",
        name: "bounty_amount_per_round",
        message: "Enter the bounty amount per round",
      })
    ).bounty_amount_per_round;
  }

  let space = (
    await prompts({
      type: "number",
      name: "space",
      message:
        "Enter the space, you want to allocate for task account (in MBs)",
    })
  ).space;
  while (space < 3) {
    console.error("Space cannot be less than 3 mb");
    space = (
      await prompts({
        type: "number",
        name: "space",
        message:
          "Enter the space, you want to allocate for task account (in MBs)",
      })
    ).space;
  }

  return {
    task_name,
    task_audit_program_id,
    total_bounty_amount,
    bounty_amount_per_round,
    space,
    task_description,
    task_executable_network,
    round_time,
    audit_window,
    submission_window,
    minimum_stake_amount,
    task_metadata,
    task_locals,
    koii_vars,
    allowed_failed_distributions,
  };
}

async function takeInputForWhitelisting() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress;
  const programOwnerAddress = (
    await prompts({
      type: "text",
      name: "programOwnerAddress",
      message:
        "Enter the path to program owner wallet (Only available to KOII team)",
    })
  ).programOwnerAddress;
  return {
    programOwnerAddress,
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForDeleteTask() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress;
  const programOwnerAddress = (
    await prompts({
      type: "text",
      name: "programOwnerAddress",
      message:
        "Enter the path to program owner wallet (Only available to KOII team)",
    })
  ).programOwnerAddress;
  const stakePotAccount = (
    await prompts({
      type: "text",
      name: "stakePotAccount",
      message: "Enter the stakePotAccount address",
    })
  ).stakePotAccount;
  return {
    stakePotAccount: new PublicKey(stakePotAccount),
    programOwnerAddress,
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForSetActive() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress;
  const isActive = (
    await prompts({
      type: "select",
      name: "isActive",
      message: "Do you want to set the task to Active or Inactive?",
      choices: [
        {
          title: "Active",
          description: "Set the task active",
          value: "Active",
        },
        {
          title: "Inactive",
          description: "Deactivate the task",
          value: "Inactive",
        },
      ],
    })
  ).isActive;
  return {
    isActive: isActive == "Active",
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}

async function takeInputForClaimReward() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress;
  const stakePotAccount = (
    await prompts({
      type: "text",
      name: "stakePotAccount",
      message: "Enter the stakePotAccount address",
    })
  ).stakePotAccount;
  const beneficiaryAccount = (
    await prompts({
      type: "text",
      name: "beneficiaryAccount",
      message:
        "Enter the beneficiaryAccount address (Address that the funds will be transferred to)",
    })
  ).beneficiaryAccount;
  const claimerKeypair = (
    await prompts({
      type: "text",
      name: "claimerKeypair",
      message: "Enter the path to Claimer wallet",
    })
  ).claimerKeypair;
  return {
    claimerKeypair,
    beneficiaryAccount: new PublicKey(beneficiaryAccount),
    stakePotAccount: new PublicKey(stakePotAccount),
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForFundTask() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress;
  const stakePotAccount = (
    await prompts({
      type: "text",
      name: "stakePotAccount",
      message: "Enter the stakePotAccount address",
    })
  ).stakePotAccount;
  const amount = (
    await prompts({
      type: "text",
      name: "amount",
      message: "Enter the amount(in KOII) to fund",
    })
  ).amount;
  return {
    amount: amount * LAMPORTS_PER_SOL,
    stakePotAccount: new PublicKey(stakePotAccount),
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForWithdraw() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress;
  const submitterWalletPath = (
    await prompts({
      type: "text",
      name: "submitterWalletPath",
      message: "Enter the submitter wallet path address",
    })
  ).submitterWalletPath;

  let wallet = fs.readFileSync(submitterWalletPath, "utf-8");
  let submitterKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(wallet))
  );
  return {
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
    submitterKeypair,
  };
}

async function takeInputForHandleManagerAccounts() {
  let operation = (
    await prompts({
      type: "text",
      name: "operation",
      message: "Enter the operation (init, remove, insert)",
    })
  ).operation;
  while (
    operation != "init" &&
    operation != "remove" &&
    operation != "insert"
  ) {
    operation = (
      await prompts({
        type: "text",
        name: "operation",
        message: "Enter the operation (init, remove, insert)",
      })
    ).operation;
  }
  if (operation == "init") 
    return {
      operation,
    };
  
  const signer1_wallet_path = (
    await prompts({
      type: "text",
      name: "signer1_path",
      message: "Enter the signer1 wallet path address",
    })
  ).signer1_path;

  let wallet_signer1 = fs.readFileSync(signer1_wallet_path, "utf-8");
  let signer1 = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(wallet_signer1))
  );
  const signer2_wallet_path = (
    await prompts({
      type: "text",
      name: "signer2_path",
      message: "Enter the signer2 wallet path address",
    })
  ).signer2_path;

  let wallet_signer2 = fs.readFileSync(signer2_wallet_path, "utf-8");
  let signer2 = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(wallet_signer2))
  );
  const insertOrDeleteAccount = (
    await prompts({
      type: "text",
      name: "insertOrDeleteAccount_address",
      message: `Enter the wallet address to ${operation}`,
    })
  ).insertOrDeleteAccount_address;

  return {
    operation,
    signer1,
    signer2,
    insertOrDeleteAccount: new PublicKey(insertOrDeleteAccount),
  };
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
