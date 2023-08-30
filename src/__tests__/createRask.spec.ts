/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  checkProgram,
  createTask,
  establishConnection,
  updateTask,
  ClaimReward,
  FundTask,
  SetActive,
  Whitelist,
  Withdraw
} from "../task_contract";
import * as koii_web3 from "@_koi/web3.js";
import { Keypair, PublicKey } from "@_koi/web3.js";
import * as geWallet from "../utils/getWalletFromFile"
jest.spyOn(console, "log").mockImplementation();

// jest.mock("@_koi/web3.js", () => {
//   return {
//     ...jest.requireActual("@_koi/web3.js"),
//     Connection: jest.fn().mockImplementation(() => {
//       return {
//         getBalance: jest.fn().mockResolvedValue(400)
//       };
//     })
//   };
// });
jest.mock("../task_contract.ts", () => {
  return {
    ...jest.requireActual("../task_contract.ts"),
    getStakePotAccount: jest
      .fn()
      .mockResolvedValue("stakepotaccountMywiEu6omMAaCHXkNrxb1dq8nTu3")
  };
});
jest.mock("@_koi/web3.js", () => {
    const originalModule = jest.requireActual("@_koi/web3.js");
    return {
        ...originalModule,
        Connection: jest.fn().mockImplementation(() => {
            return {
                getBalance: jest.fn().mockResolvedValue(400),
                getVersion: jest.fn().mockResolvedValue({
                    "solana-core": "1.2.3"
                }),
                getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(100),
                getAccountInfo: jest.fn().mockResolvedValue({
                    executable: true
                })
            };
        }),
        sendTransaction: jest.fn().mockImplementation(),
        sendAndConfirmTransaction: jest.fn().mockImplementation()
    };
});

// jest.doMock("../utils/getWalletFromFile.ts", () => {
//     return {
//         ...jest.requireActual("../utils/getWalletFromFile.ts"),
//         createKeypairFromFile: jest.fn().mockResolvedValue(new koii_web3.Keypair())
//     };
// });
// jest.spyOn(koii_web3, "Connection").mockImplementation(() => {
//   return {
//     getBalance: jest.fn().mockResolvedValue(400)
//   };
// });
describe("createTask", () => {
  const payerWallet = Keypair.generate();
  const task_name = "Test Task";
  const task_audit_program = "Test Audit Program";
  const total_bounty_amount = 1;
  const bounty_amount_per_round = 0.5;
  const space = 100;
  const task_description = "Test Task Description";
  const task_executable_network = "IPFS";
  const round_time = 10;
  const audit_window = 5;
  const submission_window = 5;
  const minimum_stake_amount = 0.1;
  const task_metadata = "Test Task Metadata";
  const local_vars = "Test Local Vars";
  const koii_vars = "Fdade97mdqHF11n9NsVJjpMan1i5XDdVLQpHfsLfAhf1";
  const allowed_failed_distributions = 3;

  it("should create a task and return taskStateInfoKeypair and stake_pot_account_pubkey", async () => {
    await establishConnection();
    await checkProgram();

    // sendAndConfirmTransaction.mockResolvedValueOnce(taskStateInfoKeypair);
    // sendAndConfirmTransaction.mockResolvedValueOnce(stake_pot_account_pubkey);

    const result = await createTask(
      payerWallet,
      task_name,
      task_audit_program,
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
      local_vars,
      koii_vars,
      allowed_failed_distributions
    );

    expect(result).toBeDefined();
  });

  it("should throw an error if round_time is less than audit_window + submission_window", async () => {
    await establishConnection();
    await checkProgram();

    const invalidRoundTime = audit_window + submission_window - 1;

    await expect(
      createTask(
        payerWallet,
        task_name,
        task_audit_program,
        total_bounty_amount,
        bounty_amount_per_round,
        space,
        task_description,
        task_executable_network,
        invalidRoundTime,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        local_vars,
        koii_vars,
        allowed_failed_distributions
      )
    ).rejects.toThrow(
      "Round time cannot be less than audit_window + submission_window"
    );
  });

  it("should throw an error if task_description is greater than 64 characters", async () => {
    const invalidTaskDescription = "a".repeat(65);
    await establishConnection();
    await checkProgram();

    await expect(
      createTask(
        payerWallet,
        task_name,
        task_audit_program,
        total_bounty_amount,
        bounty_amount_per_round,
        space,
        invalidTaskDescription,
        task_executable_network,
        round_time,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        local_vars,
        koii_vars,
        allowed_failed_distributions
      )
    ).rejects.toThrow("task_description cannot be greater than 64 characters");
  });
});
describe("updateTask", () => {
  const payerWallet = Keypair.generate();
  const task_name = "test task";
  const task_audit_program = "test audit program";
  const bounty_amount_per_round = 1;
  const space = 100;
  const task_description = "test task description";
  const task_executable_network = "test executable network";
  const round_time = 10;
  const audit_window = 5;
  const submission_window = 3;
  const minimum_stake_amount = 0.1;
  const task_metadata = "test task metadata";
  const local_vars = "test local vars";
  const allowed_failed_distributions = 2;
  const taskAccountInfoPubKey = new PublicKey(
    "Fdade97mdqHF11n9NsVJjpMan1i5XDdVLQpHfsLfAhf1"
  );
  const statePotAccountPubKey = new PublicKey(
    "Fdade97mdqHF11n9NsVJjpMan1i5XDdVLQpHfsLfAhf1"
  );

  it("should throw an error if round_time is less than audit_window + submission_window", async () => {
    const invalidRoundTime = audit_window + submission_window - 1;

    await expect(
      updateTask(
        payerWallet,
        task_name,
        task_audit_program,
        bounty_amount_per_round,
        space,
        task_description,
        task_executable_network,
        invalidRoundTime,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        local_vars,
        allowed_failed_distributions,
        taskAccountInfoPubKey,
        statePotAccountPubKey
      )
    ).rejects.toThrow(
      "Round time cannot be less than audit_window + submission_window"
    );
  });

  it("should throw an error if task_description is greater than 64 characters", async () => {
    const invalidTaskDescription = "a".repeat(65);

    await expect(
      updateTask(
        payerWallet,
        task_name,
        task_audit_program,
        bounty_amount_per_round,
        space,
        invalidTaskDescription,
        task_executable_network,
        round_time,
        audit_window,
        submission_window,
        minimum_stake_amount,
        task_metadata,
        local_vars,
        allowed_failed_distributions,
        taskAccountInfoPubKey,
        statePotAccountPubKey
      )
    ).rejects.toThrow("task_description cannot be greater than 64 characters");
  });

  it("should create a new task state info keypair and stake pot account pubkey", async () => {
    const expectedNewTaskStateInfoKeypair = Keypair.generate();
    const expectedNewStake_pot_account_pubkey = new PublicKey(
      "Fdade97mdqHF11n9NsVJjpMan1i5XDdVLQpHfsLfAhf1"
    );
    const result = await updateTask(
      payerWallet,
      task_name,
      task_audit_program,
      bounty_amount_per_round,
      space,
      task_description,
      task_executable_network,
      round_time,
      audit_window,
      submission_window,
      minimum_stake_amount,
      task_metadata,
      local_vars,
      allowed_failed_distributions,
      taskAccountInfoPubKey,
      statePotAccountPubKey
    );

    expect(result).toBeDefined();
  });
});
describe("Whitelist", () => {
  const payerWallet = Keypair.generate();
  const taskStateInfoAddress = new PublicKey(
    "Fdade97mdqHF11n9NsVJjpMan1i5XDdVLQpHfsLfAhf1"
  );
  const PROGRAM_KEYPAIR_PATH = "./wallet.json";
  const isWhitelisted = true;

  it("should create and send a transaction with the correct instruction and data", async () => {
    const programKeypair = Keypair.generate();
    const  readWalletMock = jest.spyOn(geWallet,"createKeypairFromFile").mockImplementation(()=>{
        return new Keypair()
    })
    const result  = await Whitelist(
      payerWallet,
      taskStateInfoAddress,
      PROGRAM_KEYPAIR_PATH,
      isWhitelisted
    );
    expect(result).toBeUndefined();
    expect(readWalletMock).toHaveBeenCalledTimes(1)
  });
});
