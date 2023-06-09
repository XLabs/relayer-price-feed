import { ethers } from "ethers";
import { ContractUpdate, UpdateStrategy } from "../index";
import { Logger } from "winston";
import { GlobalConfig } from "../../environment";
import { PricingData } from "../../prices";
import { ChainId } from "@certusone/wormhole-sdk";

export type GenericRelayerStrategyConfig = {
  contractAddresses : Map<number, string>;
}

export type GenericRelayerStrategyUpdateData = {
  contractAddress: string;
  nativePrice: number;
}

//This module should be treated as a singleton
export class GenericRelayerStrategy implements UpdateStrategy {
  public name = "GenericRelayerStrategy";
  logger: Logger;
  globalConfig: GlobalConfig;
  config: GenericRelayerStrategyConfig;

  constructor(config: GenericRelayerStrategyConfig, globalConfig: GlobalConfig, logger: Logger) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.logger = logger;
  }

  public runFrequencyMs(): number {
    return 1000;
  }
  
  public async calculateUpdates(pricingData: PricingData): Promise<ContractUpdate[]> {
    const updates: ContractUpdate[] = [];

    //TODO way too dumb
    pricingData.nativeTokens.forEach((value, key) => {
      const update = {
        chainId: key as ChainId,
        updateData: {
          contractAddress: this.config.contractAddresses.get(key),
          nativePrice: value
        }
      }
      updates.push(update);
    });

    return Promise.resolve(updates);
  }
  
  
  public async pushUpdate(signer: ethers.Signer, update: ContractUpdate): Promise<ethers.providers.TransactionResponse> {
    //TODO this actually isn't right, should instatiate the delivery provider type instead
    const contract = new ethers.Contract(update.updateData.contractAddress, ["function setNativePrice(uint256)"], signer);
    const tx = await contract.setNativePrice(update.updateData.nativePrice);
    return tx;
  }

}
