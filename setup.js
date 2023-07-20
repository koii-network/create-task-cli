
jest.mock("web3.storage", () => {
  const originalModule = jest.requireActual("web3.storage");
  return {
    ...originalModule,
    Web3Storage: jest.fn().mockImplementation(() => {
      return {
        put: jest.fn().mockReturnValue("700"),
      };
    }),
    getFilesFromPath: jest.fn().mockImplementation().mockReturnValue({}),
  };
});
