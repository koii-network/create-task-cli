#!/usr/bin/env node

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  updateTask,
  SetActive,
  ClaimReward,
  FundTask,
  Withdraw,
} from "./task_contract";
import { uploadIpfs } from "./utils";
import { getConfig } from "./utils";
import prompts from "prompts";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@_koi/web3.js";
import fs from "fs";
import { config } from "dotenv";
import path from "path";
import handleMetadata from "./metadata";
import validateTaskInputs from "./validate";
import validateUpdateTaskInputs from "./validateUpdate";
import { join } from "path";
import { tmpdir } from "os";
import { Web3Storage, getFilesFromPath, Filelike } from "web3.storage";
import readYamlFile from "read-yaml-file";
config();

interface Task {
  task_name: string;
  task_executable_network: "DEVELOPMENT" | "ARWEAVE" | "IPFS";
  secret_web3_storage_key: string;
  task_audit_program?: string;
  task_audit_program_id?: string;
  round_time: number;
  audit_window: number;
  submission_window: number;
  minimum_stake_amount: number;
  total_bounty_amount: number;
  bounty_amount_per_round: number;
  allowed_failed_distributions: number;
  space: number;
}

interface UpdateTask {
  task_id: string;
  task_name: string;
  task_executable_network: "DEVELOPMENT" | "ARWEAVE" | "IPFS";
  secret_web3_storage_key: string;
  task_audit_program?: string;
  task_audit_program_id?: string;
  round_time: number;
  audit_window: number;
  submission_window: number;
  minimum_stake_amount: number;
  bounty_amount_per_round: number;
  allowed_failed_distributions: number;
  space: number;
}

interface TaskMetadata {
  author: string;
  description: string;
  repositoryUrl: string;
  createdAt: number;
  imageUrl?: string | undefined;
  requirementsTags?: RequirementTag[];
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

async function main() {
  let payerWallet: Keypair;
  const currentDir = path.resolve(process.cwd());
  //let walletPath: string = `${currentDir}/id.json`;
  let walletPath: string = (await getConfig()).keypair_path;

  console.log("Wallet path: ", walletPath);

  if (!fs.existsSync(walletPath)) {
    walletPath = (
      await prompts({
        type: "text",
        name: "walletPath",
        message: "Enter the path to your wallet",
      })
    ).walletPath;
    walletPath = walletPath.trim();

    if (!fs.existsSync(walletPath)) {
      throw Error("Please make sure that the wallet path is correct");
    }
  }

  try {
    const wallet = fs.readFileSync(walletPath, "utf-8");
    payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet)));
  } catch (e) {
    console.error("Wallet is not valid");
    //console.error(logSymbols.error, "Wallet is not valid");
    process.exit();
  }

  const mode = (
    await prompts({
      type: "select",
      name: "mode",
      message: "Select operation",

      choices: [
        { title: "Create a new task", value: "create-task" },
        { title: "update existing task", value: "update-task" },
        { title: "Activate task", value: "set-active" },
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
            allowed_failed_distributions,
          } = await takeInputForCreateTask(true);
          // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
          const minimumBalanceForRentExemption =
            (await connection.getMinimumBalanceForRentExemption(
              space * 1000000
            )) + 10000;
          const totalAmount =
            LAMPORTS_PER_SOL * total_bounty_amount +
            minimumBalanceForRentExemption;
          const response = (
            await prompts({
              type: "confirm",
              name: "response",
              message: `Your account will be deducted ${
                totalAmount / LAMPORTS_PER_SOL
              } KOII for creating the task, which includes the rent exemption(${
                minimumBalanceForRentExemption / LAMPORTS_PER_SOL
              } KOII) and bounty amount fees (${total_bounty_amount} KOII)`,
            })
          ).response;

          if (!response) process.exit(0);
          const lamports = await connection.getBalance(payerWallet.publicKey);
          if (lamports < totalAmount) {
            console.error("Insufficient balance for this operation");
            process.exit(0);
          }
          console.log("Calling Create Task");
          // TODO: All params for the createTask should be accepted from cli input and should be replaced in the function below
          const { taskStateInfoKeypair, stake_pot_account_pubkey } =
            await createTask(
              payerWallet,
              task_name,
              task_audit_program_id,
              total_bounty_amount,
              bounty_amount_per_round,
              space * 1000000,
              task_description?.substring(0, 50),
              task_executable_network,
              round_time,
              audit_window,
              submission_window,
              minimum_stake_amount,
              task_metadata,
              "",
              "",
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
          // const readYamlFile = require("read-yaml-file");
          let metaDataCid: string;
          let task_audit_program_id: string;

          const currentDir = path.resolve(process.cwd());
          let ymlPath = `${currentDir}/config-task.yml`;

          if (!fs.existsSync(ymlPath)) {
            ymlPath = (
              await prompts({
                type: "text",
                name: "ymlPath",
                message: "Enter the path to your config-task.yml file",
              })
            ).ymlPath;

            if (
              !fs.existsSync(ymlPath) ||
              (!ymlPath.includes(".yml") && !ymlPath.includes(".yaml"))
            ) {
              throw Error(
                "Please make sure that the path to your config-task.yml file is correct."
              );
            }
          }

          await readYamlFile(ymlPath).then(async (data: any) => {
            //console.log("CHECK", data.task_executable_network);

            //console.log("TN", task_executable_network);

            if (data.task_executable_network == "IPFS") {
              if (!data.secret_web3_storage_key) {
                console.log(
                  "WEB3.STORAGE KEY FROM ENV",
                  process.env.secret_web3_storage_key
                );
                data.secret_web3_storage_key =
                  process.env.secret_web3_storage_key;
                if (!data.secret_web3_storage_key) {
                  data.secret_web3_storage_key = (
                    await prompts({
                      type: "text",
                      name: "secret_web3_storage_key",
                      message: "Enter the web3.storage API key",
                    })
                  ).secret_web3_storage_key;
                  while (data.secret_web3_storage_key < 200) {
                    console.error(
                      "secret_web3_storage_key cannot be less than 200 characters"
                    );
                    data.secret_web3_storage_key = (
                      await prompts({
                        type: "text",
                        name: "secret_web3_storage_key",
                        message: "Enter the web3.storage API key",
                      })
                    ).secret_web3_storage_key;
                  }
                }
              }
              task_audit_program_id = await uploadIpfs(
                data.task_audit_program,
                data.secret_web3_storage_key
              );
              console.log("TASK CID", task_audit_program_id);
            } else if (
              data.task_executable_network == "ARWEAVE" ||
              data.task_executable_network == "DEVELOPMENT"
            ) {
              //console.log("IN DEVELOPMENT");
              task_audit_program_id = data.task_audit_program_id;
              if (!data.secret_web3_storage_key) {
                console.log(
                  "WEB3.STORAGE KEY FROM ENV",
                  process.env.secret_web3_storage_key
                );
                data.secret_web3_storage_key =
                  process.env.secret_web3_storage_key;
                if (!data.secret_web3_storage_key) {
                  data.secret_web3_storage_key = (
                    await prompts({
                      type: "text",
                      name: "secret_web3_storage_key",
                      message: "Enter the web3.storage API key",
                    })
                  ).secret_web3_storage_key;
                  while (data.secret_web3_storage_key < 200) {
                    console.error(
                      "secret_web3_storage_key cannot be less than 200 characters"
                    );
                    data.secret_web3_storage_key = (
                      await prompts({
                        type: "text",
                        name: "secret_web3_storage_key",
                        message: "Enter the web3.storage API key",
                      })
                    ).secret_web3_storage_key;
                  }
                }
              }
            } else {
              console.error(
                "Please specify the correct task_executable_network in YML"
              );
              process.exit();
            }

            const metaData: TaskMetadata = {
              author: data.author.trim(),
              description: data.description.trim(),
              repositoryUrl: data.repositoryUrl,
              createdAt: Date.now(),
              imageUrl: data.imageUrl,
              requirementsTags: data.requirementsTags,
            };

            const TaskData: Task = {
              task_name: data.task_name.trim(),
              task_executable_network: data.task_executable_network,
              secret_web3_storage_key: data.secret_web3_storage_key,
              task_audit_program: data.task_audit_program,
              task_audit_program_id: task_audit_program_id,
              round_time: data.round_time,
              audit_window: data.audit_window,
              submission_window: data.submission_window,
              minimum_stake_amount: data.minimum_stake_amount,
              total_bounty_amount: data.total_bounty_amount,
              bounty_amount_per_round: data.bounty_amount_per_round,
              allowed_failed_distributions: data.allowed_failed_distributions,
              space: data.space,
            };

            console.log("TASK DATA", TaskData);
            console.log("Metadata", metaData);

            await validateTaskInputs(metaData, TaskData);

            const tmp = tmpdir();
            const metadataPath = join(tmp, "metadata.json");
            fs.writeFileSync(metadataPath, JSON.stringify(metaData));
            const storageClient = new Web3Storage({
              token: data.secret_web3_storage_key as string,
            });

            const upload: any = await getFilesFromPath([metadataPath]);

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

            // Before pasing it to createTask validate the input
            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                data.space * 1000000
              )) + 10000;

            const totalAmount =
              LAMPORTS_PER_SOL * data.total_bounty_amount +
              minimumBalanceForRentExemption;
            const response = (
              await prompts({
                type: "confirm",
                name: "response",
                message: `Your account will be deducted ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for creating the task, which includes the rent exemption(${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and bounty amount fees (${
                  data.total_bounty_amount
                } KOII)`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.error("Insufficient balance for this operation");
              process.exit(0);
            }

            console.log("Calling Create Task");
            // Before passing it to createTask validate the inputs
            const { taskStateInfoKeypair, stake_pot_account_pubkey } =
              await createTask(
                payerWallet,
                TaskData.task_name,
                task_audit_program_id,
                TaskData.total_bounty_amount,
                TaskData.bounty_amount_per_round,
                TaskData.space * 1000000,
                data?.description?.substring(0, 50),
                TaskData.task_executable_network,
                TaskData.round_time,
                TaskData.audit_window,
                TaskData.submission_window,
                TaskData.minimum_stake_amount,
                metaDataCid,
                "",
                "",
                TaskData.allowed_failed_distributions
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
    case "update-task": {
      const taskMode = (
        await prompts({
          type: "select",
          name: "mode",
          message: "Select operation",

          choices: [
            { title: "using CLI", value: "cli" },
            { title: "using config YML", value: "yml" },
          ],
        })
      ).mode;
      console.log(taskMode);

      switch (taskMode) {
        case "cli": {
          const taskId = (
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
          const rawData = accountInfo.data + "";
          const state = JSON.parse(rawData);
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
            bounty_amount_per_round,
            space,
            task_description,
            task_executable_network,
            round_time,
            audit_window,
            submission_window,
            minimum_stake_amount,
            task_metadata,
            allowed_failed_distributions,
          } = await takeInputForCreateTask(false, state);
          // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
          const minimumBalanceForRentExemption =
            (await connection.getMinimumBalanceForRentExemption(
              space * 1000000
            )) + 10000;
          const totalAmount = minimumBalanceForRentExemption;
          const response = (
            await prompts({
              type: "confirm",
              name: "response",
              message: `Your account will be deducted ${
                totalAmount / LAMPORTS_PER_SOL
              } KOII for creating the task, which includes the rent exemption (${
                minimumBalanceForRentExemption / LAMPORTS_PER_SOL
              } KOII) and bounty amount fees is taken from the last task`,
            })
          ).response;

          if (!response) process.exit(0);
          const lamports = await connection.getBalance(payerWallet.publicKey);
          if (lamports < totalAmount) {
            console.error("Insufficient balance for this operation");
            process.exit(0);
          }
          console.log("Calling Update Task");

          const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
            await updateTask(
              payerWallet,
              task_name,
              task_audit_program_id,
              bounty_amount_per_round,
              space * 1000000,
              task_description,
              task_executable_network,
              round_time,
              audit_window,
              submission_window,
              minimum_stake_amount,
              task_metadata,
              "",
              allowed_failed_distributions,
              taskAccountInfoPubKey,
              statePotAccount
            );
          fs.writeFileSync(
            "taskStateInfoKeypair.json",
            JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey))
          );
          console.log("Task Id:", newTaskStateInfoKeypair.publicKey.toBase58());
          console.log(
            "Stake Pot Account Pubkey:",
            newStake_pot_account_pubkey.toBase58()
          );
          console.log(
            "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
          );
          break;
        }

        case "yml": {
          let metaDataCid: string;
          let task_audit_program_id_update: string;

          const currentDir = path.resolve(process.cwd());
          let ymlPath = `${currentDir}/config-task.yml`;

          if (!fs.existsSync(ymlPath)) {
            ymlPath = (
              await prompts({
                type: "text",
                name: "ymlPath",
                message: "Enter the path to your config-task.yml file",
              })
            ).ymlPath;
            if (
              !fs.existsSync(ymlPath) ||
              (!ymlPath.includes(".yml") && !ymlPath.includes(".yaml"))
            ) {
              throw Error(
                "Please make sure that the path to your config-task.yml file is correct."
              );
            }
          }

          await readYamlFile(ymlPath).then(async (data: any) => {
            //console.log("CHECK", data.task_executable_network);

            //console.log("TN", task_executable_network);

            if (data.task_executable_network == "IPFS") {
              if (!data.secret_web3_storage_key) {
                data.secret_web3_storage_key = (
                  await prompts({
                    type: "text",
                    name: "secret_web3_storage_key",
                    message: "Enter the web3.storage API key",
                  })
                ).secret_web3_storage_key;
                while (data.secret_web3_storage_key < 200) {
                  console.error(
                    "secret_web3_storage_key cannot be less than 200 characters"
                  );
                  data.secret_web3_storage_key = (
                    await prompts({
                      type: "text",
                      name: "secret_web3_storage_key",
                      message: "Enter the web3.storage API key",
                    })
                  ).secret_web3_storage_key;
                }
              }
              task_audit_program_id_update = await uploadIpfs(
                data.task_audit_program,
                data.secret_web3_storage_key
              );
              console.log("TASK CID", task_audit_program_id_update);
            } else if (
              data.task_executable_network == "ARWEAVE" ||
              data.task_executable_network == "DEVELOPMENT"
            ) {
              //console.log("IN DEVELOPMENT");
              task_audit_program_id_update = data.task_audit_program_id;
              if (!data.secret_web3_storage_key) {
                console.log(
                  "WEB3.STORAGE KEY FROM ENV",
                  process.env.secret_web3_storage_key
                );
                data.secret_web3_storage_key =
                  process.env.secret_web3_storage_key;
                if (!data.secret_web3_storage_key) {
                  data.secret_web3_storage_key = (
                    await prompts({
                      type: "text",
                      name: "secret_web3_storage_key",
                      message: "Enter the web3.storage API key",
                    })
                  ).secret_web3_storage_key;
                  while (data.secret_web3_storage_key < 200) {
                    console.error(
                      "secret_web3_storage_key cannot be less than 200 characters"
                    );
                    data.secret_web3_storage_key = (
                      await prompts({
                        type: "text",
                        name: "secret_web3_storage_key",
                        message: "Enter the web3.storage API key",
                      })
                    ).secret_web3_storage_key;
                  }
                }
              }
            } else {
              console.error(
                "Please specify the correct task_executable_network in YML"
              );
              process.exit();
            }

            const metaData: TaskMetadata = {
              author: data.author.trim(),
              description: data.description.trim(),
              repositoryUrl: data.repositoryUrl,
              createdAt: Date.now(),
              imageUrl: data.imageUrl,
              requirementsTags: data.requirementsTags,
            };

            const TaskData: UpdateTask = {
              task_id: data.task_id,
              task_name: data.task_name.trim(),
              task_executable_network: data.task_executable_network,
              secret_web3_storage_key: data.secret_web3_storage_key,
              task_audit_program: data.task_audit_program,
              task_audit_program_id: task_audit_program_id_update,
              round_time: data.round_time,
              audit_window: data.audit_window,
              submission_window: data.submission_window,
              minimum_stake_amount: data.minimum_stake_amount,
              bounty_amount_per_round: data.bounty_amount_per_round,
              allowed_failed_distributions: data.allowed_failed_distributions,
              space: data.space,
            };

            console.log("TASK DATA", TaskData);
            console.log("Metadata", metaData);

            await validateUpdateTaskInputs(metaData, TaskData);

            const tmp = tmpdir();
            const metadataPath = join(tmp, "metadata.json");
            fs.writeFileSync(metadataPath, JSON.stringify(metaData));
            const storageClient = new Web3Storage({
              token: data.secret_web3_storage_key as string,
            });
            const upload: any = await getFilesFromPath([metadataPath]);
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

            const accountInfo = await connection.getAccountInfo(
              new PublicKey(TaskData.task_id)
            );

            // Add this in validation

            if (accountInfo == null) {
              console.error("No task found with this Id");
              process.exit();
            }
            const rawData: any = accountInfo.data + "";
            const state = JSON.parse(rawData);
            //console.log(state);
            if (
              new PublicKey(state.task_manager).toString() !==
              payerWallet.publicKey.toString()
            ) {
              console.error("You are not the owner of this task! ");
              process.exit();
            }
            const taskAccountInfoPubKey = new PublicKey(TaskData.task_id);
            //console.log("OLD TASK STATE INFO", taskAccountInfoPubKey);
            const statePotAccount = new PublicKey(state.stake_pot_account);
            //console.log("OLD STATE POT", statePotAccount);

            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                TaskData.space * 1000000
              )) + 10000;
            const totalAmount = minimumBalanceForRentExemption;
            const response = (
              await prompts({
                type: "confirm",
                name: "response",
                message: `Your account will be deducted ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for creating the task, which includes the rent exemption (${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and bounty amount fees is taken from the last task`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.error("Insufficient balance for this operation");
              process.exit(0);
            }
            console.log("Calling Update Task");

            const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
              await updateTask(
                payerWallet,
                TaskData.task_name,
                task_audit_program_id_update,
                TaskData.bounty_amount_per_round,
                TaskData.space * 1000000,
                data?.description?.substring(0, 50),
                TaskData.task_executable_network,
                TaskData.round_time,
                TaskData.audit_window,
                TaskData.submission_window,
                TaskData.minimum_stake_amount,
                metaDataCid,
                "",
                TaskData.allowed_failed_distributions,
                taskAccountInfoPubKey,
                statePotAccount
              );
            fs.writeFileSync(
              "taskStateInfoKeypair.json",
              JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey))
            );
            console.log(
              "Task Id:",
              newTaskStateInfoKeypair.publicKey.toBase58()
            );
            console.log(
              "Stake Pot Account Pubkey:",
              newStake_pot_account_pubkey.toBase58()
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

    default:
      console.error("Invalid option selected");
  }
  console.log("Success");
}

async function takeInputForCreateTask(isBounty: boolean, state?: any) {
  let task_name = (
    await prompts({
      type: "text",
      name: "task_name",
      message: "Enter the name of the task",
    })
  ).task_name.trim();
  while (task_name.length > 24) {
    console.error("The task name cannot be greater than 24 characters");
    task_name = (
      await prompts({
        type: "text",
        name: "task_name",
        message: "Enter the name of the task",
        initial: state?.name || null,
      })
    ).task_name.trim();
  }
  const task_description = (
    await prompts({
      type: "text",
      name: "task_description",
      message: "Enter a short description of your task",
    })
  ).task_description.trim();

  const task_executable_network = (
    await prompts({
      type: "select",
      name: "task_executable_network",
      message: "Please select the type of network",
      choices: [
        {
          title: "DEVELOPMENT",
          value: "DEVELOPMENT",
        },
        {
          title: "IPFS",
          value: "IPFS",
        },
        {
          title: "ARWEAVE",
          value: "ARWEAVE",
        },
      ],
    })
  ).task_executable_network;

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
  const round_time = (
    await prompts({
      type: "number",
      name: "round_time",
      message: "Enter the round time in slots",
    })
  ).round_time;
  const audit_window = (
    await prompts({
      type: "number",
      name: "audit_window",
      message: "Enter the audit window in slots",
    })
  ).audit_window;
  const submission_window = (
    await prompts({
      type: "number",
      name: "submission_window",
      message: "Enter the submission window in slots",
    })
  ).submission_window;
  const minimum_stake_amount = (
    await prompts({
      type: "number",
      name: "minimum_stake_amount",
      message: "Enter the minimum staking amount for the task (in KOII)",
      float: true,
    })
  ).minimum_stake_amount;
  let total_bounty_amount;

  if (isBounty) {
    total_bounty_amount = (
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

  const task_metadata = (
    await prompts({
      type: "text",
      name: "task_metadata",
      message: `Enter TaskMetadata CID hosted on ${"IPFS"} (Leave empty for None).`,
    })
  ).task_metadata;
  if (isBounty) {
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
  }

  let space = (
    await prompts({
      type: "number",
      name: "space",
      message:
        "Enter the space, you want to allocate for task account (in MBs)",
    })
  ).space;
  while (space < 1) {
    console.error("Space cannot be less than 1 mb");
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
    allowed_failed_distributions,
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

  const wallet = fs.readFileSync(submitterWalletPath, "utf-8");
  const submitterKeypair = Keypair.fromSecretKey(
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
