import axios from "axios";
import { Logger } from "winston";
import { TokenInfo } from "./";
import { ethers } from "ethers";
import { ChainId } from "@certusone/wormhole-sdk";
import { PriceFetcher, PricingData } from ".";
import { PrometheusExporter } from "../prometheus";

export type PriceFetchingConfig = {};

export class FetcherError extends Error {}

export type CoingeckoTokenInfo = TokenInfo & {
  coingeckoId: string;
};

export type CoingeckoProviderOptions = {
  tokens: CoingeckoTokenInfo[];
  rpcs: Map<ChainId, string>;
  gasPrice?: Map<ChainId, ethers.BigNumber>;
};

function getDefaultPricingData(): PricingData {
  return {
    isValid: false,
    nativeTokens: new Map<ChainId, ethers.BigNumber>(),
    gasPrices: new Map<ChainId, ethers.BigNumber>(),
  };
}

export class CoingeckoPriceFetcher implements PriceFetcher {
  logger: Logger;
  config: CoingeckoProviderOptions;
  tokens: CoingeckoTokenInfo[];
  tokenIds: string[];
  rpcs: Map<ChainId, string>;
  pricingData: PricingData = getDefaultPricingData();
  priceCache: any; // @TODO: Add price cache
  pricePrecision: number = 6; // Discuss with chase
  defaultGasPrice = ethers.utils.parseUnits("30", "gwei");
  exporter?: PrometheusExporter;

  constructor(
    logger: Logger,
    config: CoingeckoProviderOptions,
    metricsExporter?: PrometheusExporter
  ) {
    this.logger = logger;
    this.config = config;
    this.tokens = config.tokens;
    this.tokenIds = Array.from(
      new Set(config.tokens.map((token) => token.coingeckoId))
    );

    this.rpcs = config.rpcs;
    this.exporter = metricsExporter;
  }

  runFrequencyMs(): number {
    return 10 * 1000; // 10 seconds
  }

  getPricingData(): PricingData {
    return this.pricingData;
  }

  public async updatePricingData(): Promise<void> {
    const tokens = this.tokenIds.join(",");
    this.logger!.info(`Fetching prices for: ${tokens}`);
    const { data, status } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokens}&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (status != 200) {
      throw new FetcherError(`Error from coingecko status code: ${status}`);
    }

    this.pricingData = {
      isValid: true,
      nativeTokens: this.formatPriceUpdates(data),
      gasPrices: await this.fetchGasPrices(),
    };

    this.logger.info("Pricing Data valid:", this.pricingData.isValid);
    this.logger.info(
      "Pricing Data nativeTokens:",
      this.pricingData.nativeTokens
    );
    this.logger.info("Pricing Data gasPrice:", this.pricingData.gasPrices);
  }

  public updateFailureCounter(): void {
    this.exporter?.updatePriceProviderFailure("coingecko_provider");
  }

  public async getMetrics(): Promise<string> {
    return this.exporter?.metrics() ?? "";
  }

  private formatPriceUpdates(prices: any): Map<ChainId, ethers.BigNumber> {
    const formattedPrices = new Map<ChainId, ethers.BigNumber>();

    for (const token of this.tokens) {
      if (token.coingeckoId in prices) {
        const price = prices[token.coingeckoId].usd.toFixed(
          this.pricePrecision
        );
        formattedPrices.set(token.chainId, ethers.utils.parseUnits(price));
      }
    }

    return formattedPrices;
  }

  private async fetchGasPrices(): Promise<Map<ChainId, ethers.BigNumber>> {
    const gasPrices = new Map<ChainId, ethers.BigNumber>();
    for (const token of this.tokens) {
      const gasPrice = await this.fetchGasPriceForChain(token.chainId);
      gasPrices.set(token.chainId, gasPrice);

      this.logger.debug(`Gas price for chain ${token.chainId}: ${gasPrice}`);
    }

    return gasPrices;
  }

  private async fetchGasPriceForChain(
    chaindId: ChainId
  ): Promise<ethers.BigNumber> {
    const gasPrice =
      this.config.gasPrice?.get(chaindId) || this.defaultGasPrice;

    return gasPrice;
  }
}
