import { Connection, Version } from "@_koi/web3.js";
import { establishConnection } from "../connection";
import { getRpcUrl } from "../RPCHelper";

jest.mock("../RPCHelper");

describe("connection", () => {
  describe("establishConnection", () => {
    let connection: Connection;

    beforeEach(() => {
      connection = new Connection("http://localhost:8899", "confirmed");
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should establish a connection to the cluster", async () => {
      const getVersionSpy = jest
        .spyOn(connection, "getVersion")
        .mockResolvedValueOnce({
          "solana-core": "1.2.3",
        });
      const getRpcUrlMock = getRpcUrl as jest.MockedFunction<typeof getRpcUrl>;
      getRpcUrlMock.mockReturnValueOnce("http://localhost:8899");

      const result = await establishConnection();

      expect(result).toBe(connection);
      expect(getVersionSpy).toHaveBeenCalled();
      expect(getRpcUrlMock).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "Connection to cluster established:",
        "http://localhost:8899",
        "1.2.3"
      );
    });

    it("should return the existing connection if it already exists", async () => {
      const getVersionSpy = jest
        .spyOn(connection, "getVersion")
        .mockResolvedValueOnce({
          "solana-core": "1.2.3",
        });
      const getRpcUrlMock = getRpcUrl as jest.MockedFunction<typeof getRpcUrl>;
      getRpcUrlMock.mockReturnValueOnce("http://localhost:8899");

      const result1 = await establishConnection();
      const result2 = await establishConnection();

      expect(result1).toBe(connection);
      expect(result2).toBe(connection);
      expect(getVersionSpy).toHaveBeenCalledTimes(1);
      expect(getRpcUrlMock).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        "Connection to cluster established:",
        "http://localhost:8899",
        "1.2.3"
      );
    });
  });
});
