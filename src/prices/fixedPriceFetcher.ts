import { Logger } from "winston";
import { PriceFetcher, PricingData, getDefaultPricingData } from ".";
import { GlobalConfig } from "../environment";
import { ChainId } from "@certusone/wormhole-sdk";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { PrometheusExporter } from "../prometheus";

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
  exporter?: PrometheusExporter;

  constructor(
    config: FixedPriceFetcherConfig,
    globalConfig: GlobalConfig,
    logger: Logger,
    metricsExporter?: PrometheusExporter
  ) {
    this.config = config;
    this.data = getDefaultPricingData();
    this.globalConfig = globalConfig;
    this.logger = logger;
    this.exporter = metricsExporter;
  }

  public static loadConfig(path: string): FixedPriceFetcherConfig {
    const file = fs.readFileSync(path, "utf-8");
    const config = JSON.parse(file);

    if (!config.nativeTokens || !config.gasPrices || !config.runFrequencyMs) {
      throw new Error("Invalid config file provided to FixedPriceFetcher");
    }

    const nativeTokens = new Map<ChainId, BigNumber>();
    const gasPrices = new Map<ChainId, BigNumber>();
    const runFrequencyMs = config.runFrequencyMs;

    for (const chainId of Object.keys(config.nativeTokens)) {
      nativeTokens.set(
        parseInt(chainId) as ChainId,
        BigNumber.from(config.nativeTokens[chainId])
      );
    }

    for (const chainId of Object.keys(config.gasPrices)) {
      gasPrices.set(
        parseInt(chainId) as ChainId,
        BigNumber.from(config.gasPrices[chainId])
      );
    }

    return {
      nativeTokens,
      gasPrices,
      runFrequencyMs,
    };
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

  public updateFailureCounter(): void {
    this.exporter?.updatePriceProviderFailure("fixed_price_fetcher");
  }

  public async getMetrics(): Promise<string> {
    return this.exporter?.metrics() ?? "";
  }
}
