import { Contract } from "ethers";
import { PriceUpdate, ContractUpdate } from "../types";
import { SupportedChainId } from "../../config";

export type GenericRelayerPriceUpdate = PriceUpdate & {};

export type GenericRelayerContractUpdate = ContractUpdate & {};

export type GenericRelayerStrategyConfig = {
  contractAddresses: Record<SupportedChainId, string>;
};
