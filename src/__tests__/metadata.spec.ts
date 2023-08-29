import {
  takeInputForRequirementTypes,
  takeInputForMetadata,
  uploadMetadataToIPFS
} from "../metadata";
import * as web3Storage from "web3.storage";
import * as path from "path";
import * as os from "os"
import * as fs from "fs"
jest.mock("fs");
jest.mock("path");
jest.mock("os");
jest.spyOn(console,"log").mockImplementation();
jest.spyOn(console,"error").mockImplementation()
// jest
//   .mock("prompts").fn()
//   .mockResolvedValueOnce({ value: "value" })
//   .mockResolvedValueOnce({ description: "description" }),

jest.mock("prompts", () => {
  return (
    jest
      .fn()
      .mockResolvedValueOnce({ value: "value" })
      .mockResolvedValueOnce({ description: "description" })
      //metadata
      .mockResolvedValueOnce({ author: "author" })
      .mockResolvedValueOnce({ description: "description" })
      .mockResolvedValueOnce({ repositoryUrl: "repositoryUrl" })
      .mockResolvedValueOnce({ imageURL: "imageURL" })
      .mockResolvedValueOnce({ response: true })
      .mockResolvedValueOnce({ mode: "cpu" })
      .mockResolvedValueOnce({ value: "intel" })
      .mockResolvedValueOnce({ description: "description" })
      .mockResolvedValueOnce({ response: false })
  );
});
//write test cases here
describe("takeInputForRequirementTypes", () => {
  it("should return value and description", async () => {
    const result = await takeInputForRequirementTypes();
    expect(result).toEqual({ value: "value", description: "description" });
  });
});
//write test cases here
describe("takeInputForMetadata", () => {
  it("should return metadata", async () => {
    const result = await takeInputForMetadata();
    expect(result).toEqual({
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: "",
      imageURL: "imageURL",
      requirementsTags: [
        {
          description: "description",
          type: "cpu",
          value: "intel"
        }
      ]
    });
  });
});


jest.mock("web3.storage");



describe("Testing uploadFiles to IPFS", () => {
  it("should return a valid CID", async () => {
    const web3StorageMock = web3Storage.Web3Storage as unknown as jest.Mock;
    const writeFileSyncMock  =  fs.writeFileSync as unknown as jest.Mock; 
    writeFileSyncMock.mockImplementation()
    const tmpDirMock =  os.tmpdir as unknown as jest.Mock;
    tmpDirMock.mockReturnValueOnce("/tmp");
    const logSpy= jest.spyOn(console,"log").mockImplementation()
    // web3StorageMock.mockResolvedValueOnce("hello");
    web3StorageMock.mockImplementation(() => {
      return {
        put: jest.fn().mockResolvedValueOnce("cid"),
        getFilesFromPath: jest.fn().mockImplementation().mockReturnValue({})
      };
    });
    const CID = await uploadMetadataToIPFS({
      author: "author",
      description: "description",
      repositoryUrl: "repositoryUrl",
      createdAt: "",
      imageURL: "imageURL",
      requirementsTags: [
        {
          description: "description",
          type: "cpu",
          value: "intel"
        }
      ]
    });
    expect(logSpy).toHaveBeenCalledWith("\x1b[1m\x1b[32m%s\x1b[0m",
    `Your MetaData CID is cid/metadata.json`)
  });
});

