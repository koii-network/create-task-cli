import { uploadIpfs,getConfig } from "../src/utils";
import * as utils from "../src/utils";
import fs from "fs";
import { Web3Storage } from "web3.storage";
import yaml from "yaml";

// // jest.mock("web3.storage", () => ({
// //   ...jest.requireActual("Web3.storage"),
// //   Web3Storage: jest.spyOn("Web3Storage",)

// // }));
// describe("Test getRPCURL", () => {
//   // let getCOnfigSpy = jest
//   //   .spyOn(utils, "getConfig")
//   //   .mockImplementationOnce(async () => {
//   //     return {
//   //       json_rpc_url: "http://localhost:8899",
//   //       websocket_url: "",
//   //       keypair_path: "/home/dev/.config/koii/id.json",
//   //       address_labels: { "11111111111111111111111111111111": "System Program" },
//   //       commitment: "confirmed",
//   //     };
//   //   });
//   it("should return RPC URL", async () => {
//     let response = await utils.getRpcUrl();
//     // expect(getCOnfigSpy).toHaveBeenCalle
//     dTimes(1);
//     expect(response).toBe("http://localhost:8899");
//   });
// });

fsReadFileSyncMock
  .mockReturnValueOnce(
    `json_rpc_url: "http://localhost:8899"
websocket_url: ""
keypair_path: /home/dev/.config/koii/id.json
address_labels:
  "11111111111111111111111111111111": System Program
commitment: confirmed`
  )
  .mockImplementation(() => {
    throw new Error();
  });
fsExistsSyncMock.mockReturnValue(true);
const mockExit = jest.spyOn(process, "exit").mockImplementation();
describe("Testing getConfig", () => {
  it("should return the parsed YAML config", async () => {
    expect(await getConfig()).toEqual(yaml.parse(config));
  });
  it("should print instructions to install CLI ", async () => {
    await getConfig();
    expect(mockExit).toBeCalledWith(1);
  });
});

describe("uploadIpfs", () => {
  it("should upload file to IPFS and return the CID", async () => {
    const filePath = "path/to/main.js";
    const secret_web3_storage_key = "your-secret-key";
    uploadIpfs("main.js", "eeee");

    // Mock the existence of the file
    // fs.existsSync.mockReturnValue(true);

    // Mock the Web3Storage client and its put method
    //   const mockPut = jest.fn().mockResolvedValue("mocked-cid");
    //   const mockStorageClient = {
    //     put: mockPut,
    //   };
    //   Web3Storage.mockImplementation(() => mockStorageClient);

    //   // Call the function
    //   const result = await uploadIpfs(filePath, secret_web3_storage_key);

    //   // Assertions
    //   expect(fs.existsSync).toHaveBeenCalledWith(filePath);
    //   expect(Web3Storage).toHaveBeenCalledWith({
    //     token: secret_web3_storage_key || "",
    //   });
    //   expect(mockPut).toHaveBeenCalled();
    //   expect(result).toBe("mocked-cid");
    // });

    // it("should log an error and exit if the file is not found", async () => {
    //   const filePath = "path/to/nonexistent.js";
    //   const secret_web3_storage_key = "your-secret-key";

    //   // Mock the non-existence of the file
    //   fs.existsSync.mockReturnValue(false);

    //   // Mock the process.exit function
    //   const mockExit = jest.spyOn(process, "exit").mockImplementation();

    //   // Call the function
    //   await uploadIpfs(filePath, secret_web3_storage_key);

    //   // Assertions
    //   expect(fs.existsSync).toHaveBeenCalledWith(filePath);
    //   expect(console.error).toHaveBeenCalledWith(
    //     "task_audit_program File not found"
    //   );
    //   expect(mockExit).toHaveBeenCalled();

    //   // Restore the original process.exit function
    //   mockExit.mockRestore();
  });
});
