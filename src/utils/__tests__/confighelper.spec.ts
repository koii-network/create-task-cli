import { getConfig } from "../configHelper";
import fs from "fs";
import yaml from "yaml";

const config = `json_rpc_url: "http://localhost:8899"
websocket_url: ""
keypair_path: /home/dev/.config/koii/id.json
address_labels:
  "11111111111111111111111111111111": System Program
commitment: confirmed`;

jest.mock("fs");
const fsReadFileSyncMock = fs.readFileSync as jest.Mock;
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
const mockExit = jest.spyOn(process, "exit").mockImplementation();

describe("Testing getConfig", () => {
  it("should return the parsed YAML config", async () => {
    expect(await getConfig()).toEqual(yaml.parse(config));
  });
  it("should print instructions to install CLI", async () => {
    await getConfig();
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// const fsReadFileSyncMock = fs.readFileSync as jest.Mock;
// const fsExistsSyncMock = fs.existsSync as jest.Mock;
// jest.mock("../src/utils", () => ({
//   ...jest.requireActual("../src/utils"),
//   getConfig: jest.fn().mockReturnValue({
//     json_rpc_url: "http://localhost:8899",
//     websocket_url: "",
//     keypair_path: "/home/dev/.config/koii/id.json",
//     address_labels: { "11111111111111111111111111111111": "System Program" },
//     commitment: "confirmed",
//   }),
// }));
