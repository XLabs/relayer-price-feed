import { ethers } from "ethers";
import { ContractUpdate, UpdateStrategy } from "../index";
import { Logger } from "winston";
import { GlobalConfig } from "../../environment";
import { PricingData } from "../../prices/fetcher";

type GenericRelayerStrategyEnvironment = {};
let localEnv: GenericRelayerStrategyEnvironment | undefined;
function getLocalEnv(): GenericRelayerStrategyEnvironment {
  if (!localEnv) {
    throw new Error("GenericRelayerStrategyEnvironment not initialized");
  }
  return localEnv;
}

function initialize(env: GlobalConfig, logger: Logger): Promise<void> {
  return Promise.resolve();
}

function runFrequencyMs(): number {
  return 1000;
}

function calculateUpdates(pricingData: PricingData): Promise<ContractUpdate[]> {
  const updates: ContractUpdate[] = [];
  return Promise.resolve(updates);
}

async function pushUpdate(
  signer: ethers.Signer,
  update: ContractUpdate
): Promise<ethers.providers.TransactionResponse> {
  throw new Error("Not implemented");
}

//This module should be treated as a singleton
const strategy: UpdateStrategy = {
  name: "GenericRelayer",
  initialize,
  runFrequencyMs,
  calculateUpdates,
  pushUpdate,
};

export default strategy;
