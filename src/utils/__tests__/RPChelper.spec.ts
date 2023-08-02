import { getRpcUrl } from "../RPCHelper";

jest.mock("../configHelper", () => ({
  getConfig: jest
    .fn()
    .mockReturnValueOnce({
      json_rpc_url: "http://localhost:8899",
      websocket_url: "",
      keypair_path: "/home/dev/.config/koii/id.json",
      address_labels: { "11111111111111111111111111111111": "System Program" },
      commitment: "confirmed",
    })
    .mockReturnValueOnce({
      websocket_url: "",
      keypair_path: "/home/dev/.config/koii/id.json",
      address_labels: { "11111111111111111111111111111111": "System Program" },
      commitment: "confirmed",
    }),
}));

describe("Testing getRPCURL", () => {
  it("should return RPC URL from config", async () => {
    const RPCURL = await getRpcUrl();
    expect(RPCURL).toBe("http://localhost:8899");
  });
  it("should throw error if config is found but without error",async ()=>{
    const RPCURL = await getRpcUrl();
    expect(RPCURL).toBe("https://k2-testnet.kobii.live");
  });
});
