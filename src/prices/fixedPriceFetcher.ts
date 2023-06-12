import { Logger } from "winston";
import { PriceFetcher, PricingData, getDefaultPricingData } from ".";
import { GlobalConfig } from "../environment";
import { ChainId } from "@certusone/wormhole-sdk";
import { BigNumber } from "ethers";

export type FixedPriceFetcherConfig = {
  nativeTokens: Map<ChainId, BigNumber>;
  gasPrices: Map<ChainId, BigNumber>;
  runFrequencyMs: number;
};

export class FixedPriceFetcher implements PriceFetcher {
  config: FixedPriceFetcherConfig;
  data: PricingData;
  globalConfig: GlobalConfig;
  logger: Logger;

  constructor(
    config: FixedPriceFetcherConfig,
    globalConfig: GlobalConfig,
    logger: Logger
  ) {
    this.config = config;
    this.data = getDefaultPricingData();
    this.globalConfig = globalConfig;
    this.logger = logger;
  }

  public async updatePricingData(): Promise<void> {
    this.data.isValid = true;
    this.data.nativeTokens = this.config.nativeTokens;
    this.data.gasPrices = this.config.gasPrices;
  }

  public getPricingData(): PricingData {
    return this.data;
  }

  public runFrequencyMs(): number {
    return this.config.runFrequencyMs;
  }
}
