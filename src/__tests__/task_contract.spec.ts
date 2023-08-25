/* eslint-disable */
import { Connection, Keypair, PublicKey } from "@_koi/web3.js";
import * as koii_web3 from "@_koi/web3.js"
import {
  checkProgram,
  establishConnection,
  establishPayer,
  rustString,
} from "../task_contract";
import exp from "constants";
const BufferLayout = require("@solana/buffer-layout");
let mockedExit = jest.spyOn(process, "exit").mockImplementation();
jest.mock("../utils/getPayer", () => {
  return {
    ...jest.requireActual("../utils/getPayer"),
    getPayer: jest.fn().mockResolvedValueOnce(() => {
      return new Keypair();
    }),
  };
});

jest.mock("@_koi/web3.js");
 () => {
  return {
    Connection: jest.fn().mockImplementation(() => {
      return {
        ...jest.requireActual("@_koi/web3.js").Connection,
        getRecentBlockhash: jest.fn().mockResolvedValueOnce({
          feeCalculator: { lamportsPerSignature: 42 },
          blockhash: "i",
        }),
        getMinimumBalanceForRentExemption: jest
          .fn()
          .mockResolvedValueOnce(1000)
          .mockResolvedValueOnce(100000000000000000000),
        getBalance: jest
          .fn()
          .mockResolvedValueOnce(1000)
          .mockResolvedValueOnce(-1),
        getVersion: jest.fn().mockResolvedValue({
          "solana-core": "1.2.3",
        }),
        getAccountInfo: jest.fn().mockResolvedValueOnce({
          lamports: 1000,
          owner: new Keypair().publicKey,
          executable: true,
          rentEpoch: 0,
          
        }).mockResolvedValueOnce(null)

      };
    }),
  };
}

describe("rustString", () => {
  it("should encode and decode a string correctly", () => {
    const str = "test string";
    const encoded = Buffer.alloc(rustString().alloc(str));
    rustString().encode(str, encoded, 0);
    const decoded = rustString().decode(encoded, 0);
    expect(decoded).toEqual(str);
  });

  it("should encode and decode an empty string correctly", () => {
    const str = "";
    const encoded = Buffer.alloc(rustString().alloc(str));
    rustString().encode(str, encoded, 0);
    const decoded = rustString().decode(encoded, 0);
    expect(decoded).toEqual(str);
  });

  it("should encode and decode a string with special characters correctly", () => {
    const str = "test string with special characters: !@#$%^&*()_+";
    const encoded = Buffer.alloc(rustString().alloc(str));
    rustString().encode(str, encoded, 0);
    const decoded = rustString().decode(encoded, 0);
    expect(decoded).toEqual(str);
  });
});

describe.only("Testing establishPayer", () => {
  const getRecentBlockhashMock = koii_web3.Connection.prototype.getRecentBlockhash as unknown as jest.Mock;
  getRecentBlockhashMock.mockResolvedValueOnce({
    feeCalculator: { lamportsPerSignature: 42 },
    blockhash: "i",
  });
  const getVersionMock = koii_web3.Connection.prototype.getVersion as unknown as jest.Mock;
  getVersionMock.mockResolvedValue({
    "solana-core": "1.2.3",
  });
  const getMinimumBalanceForRentExemptionMock = koii_web3.Connection.prototype.getMinimumBalanceForRentExemption as unknown as jest.Mock;

  it("should establish a payer wallet if none is provided", async () => {
    await establishConnection();
    let case1 = await establishPayer(new Keypair());
    expect(case1).toBe(undefined);
    let case2 = await establishPayer(new Keypair());
    expect(case2).toBe(undefined);
    expect(mockedExit).toHaveBeenCalledTimes(1);
  });
});

describe("task_contract", () => {
  it("should check if the program is deployed", async () => {
    const connectionMock = koii_web3.Connection.prototype
      .getAccountInfo as unknown as jest.Mock;
    connectionMock
      .mockResolvedValueOnce({
        lamports: 1000,
        owner: new koii_web3.Keypair().publicKey,
        executable: true,
        rentEpoch: 0
      })
      .mockResolvedValueOnce(null)

  });
});