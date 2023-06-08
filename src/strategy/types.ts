import { ethers } from "ethers";
import { SupportedChainId } from "../config";

export type PriceUpdate = {
  name: string;
  contractUpdates: ContractUpdate[];
};
export type ContractUpdate = {
  chainId: SupportedChainId;
};
