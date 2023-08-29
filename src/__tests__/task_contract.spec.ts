/* eslint-disable */
import { Connection, Keypair, PublicKey } from "@_koi/web3.js";
import * as koii_web3 from "@_koi/web3.js";
import {
  checkProgram,
  encodeData,
  establishConnection,
  establishPayer,
  padStringWithSpaces,
} from "../task_contract";
import { connection as originalConnection } from "../task_contract";
import * as taskContract from "../task_contract";
import Layout from "@solana/buffer-layout";

const mockSomeConnection = jest.fn();
jest.mock("@_koi/web3.js");
const BufferLayout = require("@solana/buffer-layout");
let mockedExit = jest.spyOn(process, "exit").mockImplementation();
jest.mock("../utils/getPayer", () => {
  return {
    ...jest.requireActual("../utils/getPayer"),
    getPayer: jest.fn().mockReturnValue(Keypair.generate())
  };
});

() => {
  return {
    Connection: jest.fn().mockImplementation(() => {
      console.log("TESTTTTTTTTTTTTTT");
      return {
        ...jest.requireActual("@_koi/web3.js").Connection,
        getRecentBlockhash: jest.fn().mockResolvedValueOnce({
          feeCalculator: { lamportsPerSignature: 42 },
          blockhash: "i"
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
          "solana-core": "1.2.3"
        }),
        getAccountInfo: jest
          .fn()
          .mockResolvedValueOnce({
            lamports: 1000,
            owner: new Keypair().publicKey,
            executable: true,
            rentEpoch: 0
          })
          .mockResolvedValueOnce(null)
      };
    })
  };
};



describe("Testing establishPayer", () => {
  beforeEach(() => {
    jest.resetModules();
  });
  const getRecentBlockhashMock = koii_web3.Connection.prototype
    .getRecentBlockhash as unknown as jest.Mock;
  getRecentBlockhashMock.mockResolvedValueOnce({
    feeCalculator: { lamportsPerSignature: 42 },
    blockhash: "i"
  });
  const getVersionMock = koii_web3.Connection.prototype
    .getVersion as unknown as jest.Mock;
  getVersionMock.mockResolvedValue({
    "solana-core": "1.2.3"
  });

  it("should establish a payer wallet if none is provided", async () => {
    await establishConnection()
    let connection: any = taskContract.connection;
    connection = koii_web3.Connection as unknown as jest.Mock;
    const getMinimumBalanceForRentExemptionMock = koii_web3.Connection.prototype
      .getMinimumBalanceForRentExemption as unknown as jest.Mock;
    const getBalanceMock = koii_web3.Connection.prototype
      .getBalance as unknown as jest.Mock;
    getBalanceMock.mockResolvedValue(100);
    // await establishConnection();
    let case1 = await establishPayer(new Keypair());
    expect(case1).toBe(undefined);
    // let case2 = await establishPayer(new Keypair());
    // expect(case2).toBe(undefined);
    // expect(mockedExit).toHaveBeenCalledTimes(1);
  });
});

describe("task_contract", () => {
  it("should check if the program is deployed", async () => {
    await establishConnection()
    const connectionMock = koii_web3.Connection.prototype
      .getAccountInfo as unknown as jest.Mock;
    connectionMock
      .mockResolvedValueOnce({
        lamports: 1000,
        owner: new koii_web3.Keypair().publicKey,
        executable: true,
        rentEpoch: 0
      })
      .mockResolvedValueOnce(null);
  });
});

describe('encodeData', () => {
  it('should encode data correctly', () => {
    const type = {
      layout: {
        span: 10,
        encode: jest.fn(),
      },
      index: 1,
    };
    const fields = {
      property1: 'value1',
      };
    
    const result = encodeData(type, fields);
    
    expect(result).toBeDefined();
    expect(type.layout.encode).toHaveBeenCalledWith(
      expect.objectContaining({ instruction: 1, property1: 'value1' }),
      expect.any(Buffer)
    );
  });
});

describe('padStringWithSpaces', () => {
  it('should pad string with spaces to the specified length', () => {
    const input = 'hello';
    const length = 10;
    const expectedOutput = 'hello     '; // 'hello' padded with 5 spaces

    const result = padStringWithSpaces(input, length);

    expect(result).toBe(expectedOutput);
  });

  it('should not pad if input length is greater than or equal to the specified length', () => {
    const input = 'hello';
    const length = 5;

    const result = padStringWithSpaces(input, length);

    expect(result).toBe(input);
  });

  it('should pad an empty string correctly', () => {
    const input = '';
    const length = 5;
    const expectedOutput = '     '; // 5 spaces

    const result = padStringWithSpaces(input, length);

    expect(result).toBe(expectedOutput);
  });

});