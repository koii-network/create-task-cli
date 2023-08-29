import { Keypair } from "@_koi/web3.js";
import { getConfig } from "../configHelper";
import { getPayer } from "../getPayer";
afterEach(() => {
  jest.clearAllMocks();
});
jest.spyOn(console,"log").mockImplementation();
jest.spyOn(console,"error").mockImplementation()

const warn = jest.spyOn(console, "warn").mockImplementation();
jest.mock("../configHelper", () => ({
  getConfig: jest
    .fn()
    .mockReturnValueOnce({
      json_rpc_url: "http://localhost:8899",
      websocket_url: "",
      keypair_path: "/home/dev/.config/koii/id.json",
      address_labels: {
        "11111111111111111111111111111111": "System Program",
      },
      commitment: "confirmed",
    })
    .mockReturnValueOnce({
        json_rpc_url: "http://localhost:8899",
        websocket_url: "",
        address_labels: {
          "11111111111111111111111111111111": "System Program",
        },
        commitment: "confirmed",
      }),
}));
jest.mock("../getWalletFromFile", () => ({
  createKeypairFromFile: jest.fn().mockReturnValue(""),
}));

describe("Testing get payer", () => {
  it("should return the payer", () => {
    getPayer();
    expect(getConfig).toHaveBeenCalledTimes(1);
  });
  it("should return a new keypair", () => {
    const result = getPayer();
    expect(getConfig).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "Failed to create keypair from CLI config file, falling back to new random keypair"
    );
    expect(result).toBeInstanceOf(Keypair);
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
