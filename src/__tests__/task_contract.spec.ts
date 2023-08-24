/* eslint-disable */
import { rustString } from "../task_contract";
const BufferLayout = require("@solana/buffer-layout");

describe("rustString", () => {
  it("should encode and decode a string correctly", () => {
    const str = "test string";
    const encoded = Buffer.alloc(rustString().alloc(str));
    rustString().encode(str, encoded, 0);
    const decoded = rustString().decode(encoded, 0);
    expect(decoded).toEqual(str);
  });

  it("should encode and decode an empty string correctly", () => {
    const str = "";
    const encoded = Buffer.alloc(rustString().alloc(str));
    rustString().encode(str, encoded, 0);
    const decoded = rustString().decode(encoded, 0);
    expect(decoded).toEqual(str);
  });

  it("should encode and decode a string with special characters correctly", () => {
    const str = "test string with special characters: !@#$%^&*()_+";
    const encoded = Buffer.alloc(rustString().alloc(str));
    rustString().encode(str, encoded, 0);
    const decoded = rustString().decode(encoded, 0);
    expect(decoded).toEqual(str);
  });
});



