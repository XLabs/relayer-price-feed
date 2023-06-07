import { UpdateStrategy } from "..";

//TODO change this to be in line with the updated type
const strategy: UpdateStrategy = {
  pollingIntervalMs: () => 1000,
  tokenList: () => [],
  pushNewPrices: async () => {},
  setLogger: () => {},
};

export default strategy;
