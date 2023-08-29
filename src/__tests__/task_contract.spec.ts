/* eslint-disable */
import { Connection, Keypair, PublicKey } from "@_koi/web3.js";
import * as koii_web3 from "@_koi/web3.js";
import {
  checkProgram,
  encodeData,
  establishConnection,
  establishPayer,
  hh,
  padStringWithSpaces,
} from "../task_contract";
import { connection as originalConnection } from "../task_contract";
import * as taskContract from "../task_contract";
import Layout from "@solana/buffer-layout";

const mockSomeConnection = jest.fn();

const actualKeypair = jest.requireActual("@_koi/web3.js");

// (koii_web3.Keypair as unknown as jest.Mock).mockImplementation(() => {
//   return new actualKeypair.Keypair()
// });
afterEach(() => {
  jest.restoreAllMocks();
});
const BufferLayout = require("@solana/buffer-layout");
let mockedExit = jest.spyOn(process, "exit").mockImplementation();
jest.mock("../utils/getPayer", () => {
  return {
    ...jest.requireActual("../utils/getPayer"),
    getPayer: jest.fn().mockReturnValue(Keypair.generate()),
  };
});

describe("Testing establishPayer", () => {
  beforeEach(() => {
    jest.resetModules();
  });
  const getRecentBlockhashMock = koii_web3.Connection.prototype
    .getRecentBlockhash as unknown as jest.Mock;
  getRecentBlockhashMock.mockResolvedValueOnce({
    feeCalculator: { lamportsPerSignature: 42 },
    blockhash: "i",
  });
  const getVersionMock = koii_web3.Connection.prototype
    .getVersion as unknown as jest.Mock;
  getVersionMock.mockResolvedValue({
    "solana-core": "1.2.3",
  });

  it("should establish a payer wallet if none is provided", async () => {
    const connection = koii_web3.Connection as unknown as jest.Mock;
    const getMinimumBalanceForRentExemptionMock = koii_web3.Connection.prototype
      .getMinimumBalanceForRentExemption as unknown as jest.Mock;
    const getBalanceMock = koii_web3.Connection.prototype
      .getBalance as unknown as jest.Mock;
    getBalanceMock.mockResolvedValue(100);
    await establishConnection();
    let case1 = await establishPayer(new Keypair());
    expect(case1).toBe(undefined);
    let case2 = await establishPayer(new Keypair());
    expect(case2).toBe(undefined);
    expect(mockedExit).toHaveBeenCalledTimes(0);
  });
});

describe.only("task_contract", () => {
  it("should check if the program is deployed", async () => {
    // const connectionMock = koii_web3.Connection.prototype
    //   .getAccountInfo as unknown as jest.Mock;
    // connectionMock
    jest
      .spyOn(koii_web3.Connection.prototype, "getAccountInfo")
      .mockImplementationOnce(() => {
        return Promise.resolve({
          lamports: 1000,
          owner: new koii_web3.Keypair().publicKey,
          executable: true,
          rentEpoch: 0,
        });
      })

      .mockResolvedValueOnce(null);
    await establishConnection();
  });
});

describe("encodeData", () => {
  it("should encode data correctly", () => {
    const type = {
      layout: {
        span: 10,
        encode: jest.fn(),
      },
      index: 1,
    };
    const fields = {
      property1: "value1",
    };

    const result = encodeData(type, fields);

    expect(result).toBeDefined();
    expect(type.layout.encode).toHaveBeenCalledWith(
      expect.objectContaining({ instruction: 1, property1: "value1" }),
      expect.any(Buffer)
    );
  });
});

describe("padStringWithSpaces", () => {
  it("should pad string with spaces to the specified length", () => {
    const input = "hello";
    const length = 10;
    const expectedOutput = "hello     "; // 'hello' padded with 5 spaces

    const result = padStringWithSpaces(input, length);

    expect(result).toBe(expectedOutput);
  });

  it("should not pad if input length is greater than or equal to the specified length", () => {
    const input = "hello";
    const length = 5;

    const result = padStringWithSpaces(input, length);

    expect(result).toBe(input);
  });

  it("should pad an empty string correctly", () => {
    const input = "";
    const length = 5;
    const expectedOutput = "     "; // 5 spaces

    const result = padStringWithSpaces(input, length);

    expect(result).toBe(expectedOutput);
  });
});

describe.only("de", () => {
  it("should", () => {
    const a = hh();
    expect(a).toBe(1);
  });
});
