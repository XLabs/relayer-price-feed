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
  reportPriceUpdateSuccess(chainName: string): void;
  reportPriceUpdateFailure(chainName: string): void;
  reportPriceUpdateGas(chainName: string, gas: number): Promise<void>;
  reportContractNativePrice(chainName: string, price: number): void;
  reportContractGasPrice(chainName: string, price: number): void;
  getMetrics(): Promise<string>;
}
