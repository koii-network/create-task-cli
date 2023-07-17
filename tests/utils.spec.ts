import { uploadIpfs } from "../src/utils";
import fs from "fs";
import { Web3Storage } from "web3.storage";

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn().mockReturnValue(true),
}));
// jest.mock("web3.storage", () => ({
//   ...jest.requireActual("Web3.storage"),
//   Web3Storage: jest.spyOn("Web3Storage",)

// }));

jest.mock("web3.storage", () => {
  const originalModule = jest.requireActual("web3.storage");
  return {
    ...originalModule,
    Web3Storage: jest.fn().mockImplementation(() => {
      return {
        put: jest.fn().mockReturnValue("700"),
        
      };
    }),
    getFilesFromPath : jest.fn().mockImplementation().mockReturnValue({})
  };
});


describe("Testing get Config",()=>{
  it("should ")
})
describe("uploadIpfs", () => {
  it("should upload file to IPFS and return the CID", async () => {
    const filePath = "path/to/main.js";
    const secret_web3_storage_key = "your-secret-key";
    uploadIpfs("main.js","eeee");

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
