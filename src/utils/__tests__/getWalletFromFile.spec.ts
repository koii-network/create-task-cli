import { createKeypairFromFile } from "../getWalletFromFile";
import fs from "fs";
import { PublicKey } from "@_koi/web3.js";
jest.spyOn(console,"log").mockImplementation();
jest.spyOn(console,"error").mockImplementation()

jest.mock("fs");
const fsReadFileSyncMock = fs.readFileSync as jest.Mock;
fsReadFileSyncMock.mockReturnValue(
  JSON.stringify([
    136, 240, 47, 247, 162, 106, 156, 98, 5, 79, 195, 45, 251, 176, 197, 194,
    83, 107, 20, 174, 138, 129, 58, 229, 79, 113, 149, 155, 84, 92, 26, 119,
    191, 110, 111, 190, 137, 214, 181, 174, 125, 174, 147, 153, 51, 29, 25, 221,
    47, 40, 129, 233, 193, 68, 7, 222, 23, 91, 189, 133, 139, 86, 1, 31,
  ])
);

describe("Testing wallet red from file.", () => {
  it("should return the wallet", async () => {
    const expectedPublicKey = "DtGYNVyjQVu5QMn9abgHz1e3p7BRMAwAD6amQ2AsVVFc";
    const wallet = createKeypairFromFile("path");
    expect(wallet.publicKey.toString()).toEqual(expectedPublicKey);
  });
});
