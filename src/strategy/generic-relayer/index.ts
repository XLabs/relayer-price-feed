import { ethers } from "ethers";
import { ContractUpdate, UpdateStrategy } from "..";
import { GenericRelayerStrategyConfig } from "./types";

//TODO change this to be in line with the updated type
const strategy: UpdateStrategy = {
  pollingIntervalMs: () => 1000,
  tokenList: () => [],
  pushNewPrices: async () => {},
  setLogger: () => {},
};

//TODO this function should be on the UpdateStrategy interface
async function sendUpdate(
  signer: ethers.Signer,
  globalEnv: any, //TODO correct type
  strategyConfig: GenericRelayerStrategyConfig, //TODO correct type
  contractUpdate: ContractUpdate
) {
  const abi = require("./DeliveryProvider.json");

  const contract = new ethers.Contract(
    strategyConfig.contractAddresses[contractUpdate.chainId],
    abi,
    signer
  );
}

export default strategy;
