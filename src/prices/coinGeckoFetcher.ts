import axios from "axios";
import { Logger } from "winston";
import { TokenInfo } from "../feeder";
import { ethers } from "ethers";

export type PricingData = {
  prices: Map<string, ethers.BigNumber>;
};

export type PriceFetchingConfig = {};

export function getDefaultPricingData(): PricingData {
  return {
    isValid: false,
  };
}

export interface PriceFetcher {
  initialize(config: PriceFetchingConfig): void;
  fetchPrices(): Promise<PricingData>;
  tokenList(): string[];
  setLogger(logger: Logger): void;
  pollingIntervalMs(): number;
}

export class FetcherError extends Error {}

export type CoingeckoTokenInfo = TokenInfo & {
  coingeckoId: string;
};

export class CoingeckoPriceFetcher implements PriceFetcher {
  tokens: CoingeckoTokenInfo[];
  tokenIds: string[];
  logger: Logger | undefined;
  priceCache: any; // @TODO: Add price cache
  pricePrecision: number = 6; // Discuss with chase
  defaultGasPrice = "30"; // in gwei

  constructor(tokens: CoingeckoTokenInfo[]) {
    this.tokens = tokens;
    this.tokenIds = Array.from(
      new Set(tokens.map((token) => token.coingeckoId))
    );
  }

  public initialize(config: PriceFetchingConfig): Promise<void> {}

  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  pollingIntervalMs(): number {
    return 10 * 1000; // 10 seconds
  }

  public async fetchPrices(): Promise<PricingData> {
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

    const pricingData = {
      prices: this.formatPriceUpdates(data),
      gasPrice: this.fetchGasPrices(),
    };

    return pricingData;
  }

  public tokenList(): string[] {
    return Array.from(new Set(this.tokens.map((token) => token.symbol)));
  }

  private formatPriceUpdates(prices: any): Map<string, ethers.BigNumber> {
    const formattedPrices = new Map<string, ethers.BigNumber>();

    for (const token of this.tokens) {
      if (token.coingeckoId in prices) {
        const price = prices[token.coingeckoId].usd.toFixed(
          this.pricePrecision
        );
        formattedPrices.set(token.symbol, ethers.utils.parseUnits(price));
      }
    }

    return formattedPrices;
  }

  private async fetchGasPrices(): Promise<Map<number, ethers.BigNumber>> {
    const gasPrices = new Map<number, ethers.BigNumber>();
    for (const token of this.tokens) {
      gasPrices.set(
        token.chainId,
        ethers.utils.parseUnits(this.defaultGasPrice, "gwei")
      ); // @TODO: This should actually come from a node
    }

    return gasPrices;
  }
}
