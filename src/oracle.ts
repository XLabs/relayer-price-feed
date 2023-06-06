import winston, { Logger } from "winston";
import { OracleConfig, TokenInfo } from "./config";
import { FetcherError } from "./prices/fetcher";
import { StrategyError } from "./strategy/error";

const defaultConfig: OracleConfig = {
  env: "prod",
  blockchainEnv: "mainnet",
  logLevel: "error",
};

// @TODO: Add tests
export class PriceOracle {
  private config: OracleConfig;
  private logger: Logger;

  constructor(config: OracleConfig) {
    this.config = { ...defaultConfig, ...config };
    this.logger = this.buildLogger(this.config.env!, this.config.logLevel!);

    if (!this.config.priceFetcher) {
      throw new Error(`Missing parameter: priceFetcher.`);
    }

    if (!this.config.strategy) {
      throw new Error(`Missing parameter: strategy.`);
    }

    this.config.priceFetcher.setLogger(this.logger);
    this.config.strategy.setLogger(this.logger);
  }

  private buildLogger(env: string, logLevel: string): Logger {
    return winston.createLogger({
      level: logLevel,
      format: env !== "local" ? winston.format.json() : winston.format.cli(),
      defaultMeta: { service: "relayer-price-oracle" },
      transports: [new winston.transports.Console()],
    });
  }

  public async start(): Promise<void> {
    const { priceFetcher, strategy } = this.config;
    this.logger.info(`
            Starting relayer-price-oracle...
            Monitoring prices for: ${this.getTokenSymbols(
              strategy!.tokenList()
            ).join(",")}
            Price check interval: ${strategy!.pollingIntervalMs()}ms
        `);

    while (true) {
      /**
       * Wait first and then execute. If something fails along the way
       * and we want to `continue` to the next loop cycle, it would be
       * nice to wait before trying again.
       */
      this.sleep(strategy!.pollingIntervalMs());

      try {
        const updatedPrices = await priceFetcher!.fetchPrices();
        strategy!.pushNewPrices(updatedPrices);
      } catch (error: unknown) {
        if (error instanceof StrategyError) {
          this.logger.error(
            `Error pushing new prices to the contract: ${error}.`
          );
          continue;
        } else if (error instanceof FetcherError) {
          this.logger.error(`Error getting new prices: ${error}`);
          continue;
        }

        this.logger.error(`Unexpected error: ${error}`);
      }
    }
  }

  private getTokenSymbols(supportedTokens: TokenInfo[]): string[] {
    const symbols: string[] = Array.from(
      new Set(supportedTokens?.map((token) => token.symbol))
    );

    return symbols;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
