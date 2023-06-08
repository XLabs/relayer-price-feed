import axios from "axios";
import { Logger } from "winston";
import { TokenInfo } from "../oracle";

export type PricingData = {};

export interface PriceFetcher<T extends TokenInfo> {
  fetchPrices(): Promise<Map<T, BigInt>>;
  tokenList(): string[];
  setLogger(logger: Logger): void;
  pollingIntervalMs(): number;
}

export class FetcherError extends Error {}

export type CoingeckoTokenInfo = TokenInfo & {
  coingeckoId: string;
};

export class CoingeckoPriceFetcher implements PriceFetcher<CoingeckoTokenInfo> {
  tokens: CoingeckoTokenInfo[];
  tokenIds: string[];
  logger: Logger | undefined;
  priceCache: any; // @TODO: Add price cache

  constructor(tokens: CoingeckoTokenInfo[]) {
    this.tokens = tokens;
    this.tokenIds = Array.from(
      new Set(tokens.map((token) => token.coingeckoId))
    );
  }

  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  pollingIntervalMs(): number {
    return 10 * 1000; // 10 seconds
  }

  public async fetchPrices(): Promise<Map<CoingeckoTokenInfo, BigInt>> {
    const tokens = this.tokenIds.join(",");
    this.log(`Fetching prices for: ${tokens}`, "info");
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

    return this.formatPriceUpdates(data);
  }

  public tokenList(): string[] {
    return Array.from(new Set(this.tokens.map((token) => token.symbol)));
  }

  private formatPriceUpdates(prices: any): Map<CoingeckoTokenInfo, BigInt> {
    const formattedPrices = new Map<CoingeckoTokenInfo, BigInt>();

    for (const token of this.tokens) {
      if (token.coingeckoId in prices) {
        console.log("Token found: " + token);
        console.log("Price: " + prices[token.coingeckoId].usd);
        console.log(
          "Formatted: ",
          BigInt(prices[token.coingeckoId].usd * 10 ** 18)
        );
        const price = prices[token.coingeckoId].usd;
        formattedPrices.set(token, BigInt(price * 10 ** 18));
      }
    }

    this.log(`Formatting prices: ${JSON.stringify(prices)}`, "info");
    this.log(`Formatting prices: ${JSON.stringify(formattedPrices)}`, "info");

    return formattedPrices;
  }

  private log(message: string, level: string = "info"): void {
    if (this.logger) {
      this.logger.log(level, message);
    }
  }
}
