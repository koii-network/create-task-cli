import {
  takeInputForRequirementTypes,
  takeInputForMetadata,
} from "../metadata";

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
      .mockResolvedValueOnce({ createdAt: "createdAt" })
      .mockResolvedValueOnce({ requirementsTags: "requirementsTags" })
      .mockResolvedValueOnce({ type: "type" })
      .mockResolvedValueOnce({ value: "value" })
      .mockResolvedValueOnce({ type: "type" })
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
      createdAt: "createdAt",
      imageURL: "imageURL",
      requirementsTags: "requirementsTags",
    });
  });
});
