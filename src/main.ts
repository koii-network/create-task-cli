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
} from "./task_contract";
import { uploadIpfs } from "./utils";
import prompts from "prompts";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@_koi/web3.js";
import fs from "fs";
import { config } from "dotenv";
import handleMetadata from "./metadata";
config();

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
    throw Error("Please make sure that wallet is under the name id.json");

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
        { title: "Mark task as active", value: "set-active" },
        { title: "Claim reward", value: "claim-reward" },
        { title: "Fund task with more KOII", value: "fund-task" },
        { title: "Withdraw staked funds from task", value: "withdraw" },
        {
          title: "upload assets to IPFS(metadata/local vars)",
          value: "handle-assets",
        },
      ],
    })
  ).mode;
  console.log(mode);
  // Establish connection to the cluster
  const connection = await establishConnection();

  // Determine who pays for the fees
  await establishPayer(payerWallet);

  // Check if the program has been deployed
  await checkProgram();

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
          await readYamlFile("config-task.yml").then(async (data: any) => {
            console.log(data.task_name);
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
            // TODO: All params for the createTask should be accepted from cli input and should be replaced in the function below
            let { taskStateInfoKeypair, stake_pot_account_pubkey } =
              await createTask(
                payerWallet,
                data.task_name,
                data.task_audit_program_id,
                Number(data.total_bounty_amount),
                Number(data.bounty_amount_per_round),
                Number(data.space),
                data.task_description,
                data.task_executable_network,
                Number(data.round_time),
                Number(data.audit_window),
                Number(data.submission_window),
                Number(data.minimum_stake_amount),
                data.task_metadata,
                data.task_locals,
                data.koii_vars,
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
      const { programOwnerAddress, taskStateInfoAddress } =
        await takeInputForWhitelisting();
      console.log("Calling Whitelist");
      await Whitelist(payerWallet, taskStateInfoAddress, programOwnerAddress);
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
    task_audit_program = (
      await prompts({
        type: "text",
        name: "task_audit_program",
        message: "Enter the path to your executable webpack",
      })
    ).task_audit_program;
    while (task_audit_program.length > 200) {
      console.error(
        "The task audit program length cannot be greater than 64 characters"
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
