/* eslint-disable */
import { Connection, Keypair, PublicKey } from "@_koi/web3.js";
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

jest.mock("@_koi/web3.js", () => {
  return {
    ...jest.requireActual("@_koi/web3.js"),
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
          .mockResolvedValueOnce(100000000000000000000).mockImplementationOnce(() => {
            orugi,
        getBalance: jest
          .fn()
          .mockResolvedValueOnce(1000)
          .mockResolvedValueOnce(-1),
        getVersion: jest.fn().mockResolvedValue({
          "solana-core": "1.2.3",
        }),
      };
    }),
  };
});

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

describe("Testing establishPayer", () => {
  it("should establish a payer wallet if none is provided", async () => {
    await establishConnection();
    let case1= await establishPayer(new Keypair());
    expect(case1).toBe(undefined);
    let case2 = await establishPayer(new Keypair());
    expect(case2).toBe(undefined);
    expect(mockedExit).toHaveBeenCalledTimes(1);
  });
});

describe("task_contract", () => {
  describe("checkProgram", () => {
    let connection: Connection;

    beforeEach(() => {
      connection = new Connection("http://localhost:8899", "confirmed");
      (Connection as jest.MockedClass<typeof Connection>).mockImplementation(() => connection);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });
    

    it("should read the program id from the keypair file", async () => {
      const publicKeySpy = jest.spyOn(PublicKey, "fromBase58").mockReturnValueOnce(new PublicKey("Koiitask22222222222222222222222222222222222"));

      await checkProgram();

      expect(publicKeySpy).toHaveBeenCalledWith("Koiitask22222222222222222222222222222222222");
    });

    it("should throw an error if the program keypair file cannot be read", async () => {
      jest.spyOn(PublicKey, "fromBase58").mockImplementationOnce(() => {
        throw new Error("Failed to read program keypair");
      });

      await expect(checkProgram()).rejects.toThrow("Failed to read program keypair");
    });

    it("should throw an error if the program has not been deployed", async () => {
      jest.spyOn(connection, "getAccountInfo").mockResolvedValueOnce(null);

      await expect(checkProgram()).rejects.toThrow("Please use koii testnet or mainnet to deploy the program");
    });

    it("should throw an error if the program is not executable", async () => {
      jest.spyOn(connection, "getAccountInfo").mockResolvedValueOnce({ executable: false });

      await expect(checkProgram()).rejects.toThrow("Program is not executable");
    });

    it("should log the program id if it is valid", async () => {
      jest.spyOn(connection, "getAccountInfo").mockResolvedValueOnce({ executable: true });

      await checkProgram();

      expect(console.log).toHaveBeenCalledWith("Using program Koiitask22222222222222222222222222222222222");
    });
  });
});