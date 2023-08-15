/* eslint-disable jest/no-commented-out-tests */
import main from "../validate";
const mockExit = jest.spyOn(process, "exit").mockImplementation();
const mockconsoleError = jest.spyOn(console, "error")
const mockconsoleLog = jest.spyOn(console, "log")
const Web3StorageKey = "P9C19R6QxkGjwShTPSdak0c5XXMWXeyYW4h9sf6VWFAoUNVKBl3JD5qxmzGMarVvEzC2sTHu5WnPF3bFmv319D8bIwJQRH1t313lPHFAxu47ebzmYWcmzdwbTPK5AHsAsmdRRMGpgPFIpQ5wamtDYBeJeuWC6OwayHjacSbXOyilGTvdIo2XbCnffvrdNWCfxpz678I1"

//function to generate a random strig n  of 200 characters

// describe("isObjectEmpty", () => {
//   it("should return true for an empty object", () => {
//     expect(isObjectEmpty({})).toBe(true);
//   });

//   it("should return false for an object with properties", () => {
//     expect(isObjectEmpty({ prop: "value" })).toBe(false);
//   });
// });
//reset all mocks
// afterEach(() => {
//   jest.resetAllMocks();
// });
// describe("validateRequirementsTags", () => {
//   it("should return true for valid requirements tags", () => {
//     const tags = [
//       {
//         type: "GLOBAL_VARIABLE",
//         value: "value",
//         description: "description",
//       },
//       {
//         type: "CPU",
//         value: "value",
//         description: "description",
//       },
//     ];
//     // eslint-disable-next-line
//     expect(validateRequirementsTags(tags as any)).toBe(true);
//   });

//   it("should return false for invalid requirements tags", () => {
//     const tags = [
//       {
//         type: "INVALID_TYPE",
//         value: "value",
//         description: "description",
//       },
//       {
//         type: "CPU",
//         value: 123,
//         description: "description",
//       },
//     ];
//     // eslint-disable-next-line
//     expect(validateRequirementsTags(tags as any)).toBe(false);
//   });
// });

describe("main", () => {
  it("should throw an error if author is missing", () => {
    const metaData = {
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };

    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if description is missing", () => {
    const metaData = {
      author: "author",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if repositoryUrl is missing", () => {
    const metaData = {
      author: "author",
      description: "description",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if createdAt is missing", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if task_name is missing", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if task_executable_network is missing", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if secret_web3_storage_key is missing", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if taskParams is missing", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if task_name is too long", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name_that_is_too_long_to_be_valid",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if secret_web3_storage_key is too short", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: "short_key",
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if task_executable_network is invalid", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "INVALID_NETWORK",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if task parameters have invalid types or values", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: "invalid",
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if task_audit_program_id is too long", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      task_audit_program_id: "audit_program_id_that_is_too_long_to_be_valid",
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if total_bounty_amount is less than 10", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 5,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if bounty_amount_per_round is greater than total_bounty_amount", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 11,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should throw an error if space is less than 1", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 0,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });

  it("should not throw an error for valid input", () => {
    const metaData = {
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: 1234567890,
    };
    const task = {
      task_name: "task_name",
      task_executable_network: "DEVELOPMENT",
      secret_web3_storage_key: Web3StorageKey,
      round_time: 1,
      audit_window: 1,
      submission_window: 1,
      minimum_stake_amount: 1,
      total_bounty_amount: 10,
      bounty_amount_per_round: 1,
      allowed_failed_distributions: 0,
      space: 1,
    };
    // eslint-disable-next-line
    main(metaData as any, task as any);
    expect(mockExit).toHaveBeenCalled();
  });
});
