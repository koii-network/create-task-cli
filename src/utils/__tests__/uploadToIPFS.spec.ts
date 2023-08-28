import * as web3Storage from "web3.storage";
import { uploadIpfs } from "../uploadToIPFS";
import fs from "fs";
jest.mock("fs");
jest.mock("web3.storage");

afterEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks()
});

describe("Testing uploadFiles to IPFS", () => {
  it("should return a valid CID", async () => {
    const web3StorageMock = web3Storage.Web3Storage as unknown as jest.Mock;

    const ExistsSyncMock = fs.existsSync as unknown as jest.Mock;
    ExistsSyncMock.mockReturnValueOnce(true);
    // web3StorageMock.mockResolvedValueOnce("hello");
    web3StorageMock.mockImplementation(() => {
      return {
        put: jest.fn().mockResolvedValueOnce("cid"),
        getFilesFromPath: jest.fn().mockImplementation().mockReturnValue({})
      };
    });
    const CID = await uploadIpfs("main.js", "abc");
    expect(CID).toBe("cid");
  });
});
describe("should exit process", () => {
  it("should exit process", async () => {
    const web3StorageMock = web3Storage.Web3Storage as unknown as jest.Mock;
    web3StorageMock.mockImplementation(() => {
      return {
        put: jest.fn().mockResolvedValueOnce("cid"),
        getFilesFromPath: jest.fn().mockImplementation().mockReturnValue({})
      };
    });
    const ExistsSyncMock = fs.existsSync as unknown as jest.Mock;
    ExistsSyncMock.mockReturnValueOnce(false);

    const mockExit = jest.spyOn(process, "exit").mockImplementation();
    await uploadIpfs("main.js","2")
  
    expect(mockExit).toHaveBeenCalledTimes(1);
  });
  it("should exit process if file names doesn't end with main.js", async () => {
    const web3StorageMock = web3Storage.Web3Storage as unknown as jest.Mock;
    web3StorageMock.mockImplementation(() => {
      return {
        put: jest.fn().mockResolvedValueOnce("cid"),
        getFilesFromPath: jest.fn().mockImplementation().mockReturnValue({})
      };
    });
    const ExistsSyncMock = fs.existsSync as unknown as jest.Mock;
    ExistsSyncMock.mockReturnValueOnce(true);

    const mockExit = jest.spyOn(process, "exit").mockImplementation();
    await uploadIpfs("index.js","2")
    expect(mockExit).toHaveBeenCalledTimes(1);
  });
  
});
