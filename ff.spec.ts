import * as koii_web3 from "@_koi/web3.js";
import { hello, hi } from "./ff";
jest.mock("@_koi/web3.js",()=>{
  return {
    ...jest.requireActual("@_koi/web3.js"),
    connection:jest.fn().mockImplementation(()=>{
      return {}
    })
  }
});


beforeEach(()=>{
    jest.resetAllMocks()
})
describe("hello", () => {
  it("should say hello", async () => {
    const connectionMock = koii_web3.Connection.prototype
      .getAccountInfo as unknown as jest.Mock;
      .mockResolvedValueOnce({
        lamports: 1000,
        owner: new koii_web3.Keypair().publicKey,
        executable: true,
        rentEpoch: 0
      })
      .mockResolvedValueOnce(null),
      await hello();
    expect(connectionMock).toHaveBeenCalledTimes(1);
  });
  it("ff", async () => {
    const connectionMock = koii_web3.Connection.prototype
      .getAccountInfo as unknown as jest.Mock;
    connectionMock
      .mockResolvedValueOnce({
        lamports: 1000,
        owner: new koii_web3.Keypair().publicKey,
        executable: true,
        rentEpoch: 0
      })
      .mockResolvedValueOnce(null),
      hi();
      expect(connectionMock).toHaveBeenCalledTimes(1);
  });
});
