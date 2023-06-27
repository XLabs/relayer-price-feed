import { ethers } from "ethers";
import { PricingData } from "../prices";
import { ChainId } from "@certusone/wormhole-sdk";
export * from "./generic-relayer";

export type ContractUpdate = {
  chainId: ChainId;
  updateData: any;
};

export interface UpdateStrategy {
  name: string;
  runFrequencyMs(): number;
  calculateUpdates(pricingData: PricingData): Promise<ContractUpdate[]>;
  pushUpdate(
    signer: ethers.Signer,
    update: ContractUpdate
  ): Promise<ethers.providers.TransactionResponse>;
}
