import axios from "axios";
import { Logger } from "winston";

export interface PriceFetcher {
  fetchPrices(): Promise<Map<string, BigInt>>;
  tokenList(): string[];
  setLogger(logger: Logger): void;
}

export class FetcherError extends Error {}

export class CoingeckoPriceFetcher implements PriceFetcher {
  tokens: string[];
  logger: Logger | undefined;
  priceCache: any; // @TODO: Add price cache

  constructor(tokenList: string[]) {
    this.tokens = tokenList;
  }

  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  public async fetchPrices(): Promise<Map<string, BigInt>> {
    const tokens = this.tokens.join(",");
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
    return this.tokens;
  }

  private formatPriceUpdates(prices: any): Map<string, BigInt> {
    const formattedPrices = new Map<string, BigInt>();

    this.log(`Formatting prices: ${prices}`, "info");

    return formattedPrices;
  }

  private log(message: string, level: string = "info"): void {
    if (this.logger) {
      this.logger.log(level, message);
    }
  }
}
