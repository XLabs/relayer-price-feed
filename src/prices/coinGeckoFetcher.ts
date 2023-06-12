import axios from "axios";
import { Logger } from "winston";
import { TokenInfo } from "../feeder";
import { ethers } from "ethers";
import { ChainId } from "@certusone/wormhole-sdk";
import { PriceFetcher, PricingData } from ".";

export type PriceFetchingConfig = {};

export class FetcherError extends Error {}

export type CoingeckoTokenInfo = TokenInfo & {
  coingeckoId: string;
};

export type CoingeckoPricingData = PricingData & {
  gasPrice: Map<ChainId, ethers.BigNumber>;
};

function getDefaultPricingData(): CoingeckoPricingData {
  return {
    isValid: false,
    nativeTokens: new Map<ChainId, ethers.BigNumber>(),
    gasPrice: new Map<ChainId, ethers.BigNumber>(),
  };
}

export class CoingeckoPriceFetcher implements PriceFetcher {
  logger: Logger;
  tokens: CoingeckoTokenInfo[];
  tokenIds: string[];
  pricingData: CoingeckoPricingData = getDefaultPricingData();
  priceCache: any; // @TODO: Add price cache
  pricePrecision: number = 6; // Discuss with chase
  defaultGasPrice = "30"; // in gwei

  constructor(logger: Logger, tokens: CoingeckoTokenInfo[]) {
    this.logger = logger;
    this.tokens = tokens;
    this.tokenIds = Array.from(
      new Set(tokens.map((token) => token.coingeckoId))
    );
  }

  runFrequencyMs(): number {
    return 10 * 1000; // 10 seconds
  }

  getPricingData(): CoingeckoPricingData {
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
      gasPrice: await this.fetchGasPrices(),
    };
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
      gasPrices.set(
        token.chainId,
        ethers.utils.parseUnits(this.defaultGasPrice, "gwei")
      ); // @TODO: This should actually come from a node
    }

    return gasPrices;
  }
}
