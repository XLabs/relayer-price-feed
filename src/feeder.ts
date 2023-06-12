import winston, { Logger } from "winston";
import { FeederConfig } from "./config";
import { FetcherError } from "./prices/fetcher";
import { StrategyError } from "./strategy/error";
import { ChainId } from "@certusone/wormhole-sdk";

export type TokenInfo = {
  chainId: ChainId;
  address: string;
  symbol: string;
};

const defaultConfig: FeederConfig = {
  env: "prod",
  blockchainEnv: "mainnet",
  logLevel: "error",
};

// @TODO: Add tests
export class PriceFeeder {
  private config: FeederConfig;
  private logger: Logger;

  constructor(config: FeederConfig) {
    this.config = { ...defaultConfig, ...config };
    this.logger = this.buildLogger(this.config.env!, this.config.logLevel!);

    if (!this.config.priceFetcher) {
      throw new Error(`Missing parameter: priceFetcher.`);
    }

    if (!this.config.strategy) {
      throw new Error(`Missing parameter: strategy.`);
    }

    this.config.priceFetcher.setLogger(this.logger);
    this.config.strategy.initialize(this.config, this.logger);
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
Monitoring prices for: ${priceFetcher!.tokenList().join(",")}
Price check interval: ${priceFetcher!.pollingIntervalMs()}ms
`);

    while (true) {
      /**
       * Wait first and then execute. If something fails along the way
       * and we want to `continue` to the next loop cycle, it would be
       * nice to wait before trying again.
       */
      await this.sleep(priceFetcher!.pollingIntervalMs());

      try {
        const updatedPrices = await priceFetcher!.fetchPrices();
        const updates = strategy!.calculateUpdates(updatedPrices);
        // const txs = await strategy!.pushUpdates(signers, updates);
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

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function getPriceFeeder(config: FeederConfig): PriceFeeder {
  const feeder = new PriceFeeder(config);
  feeder.start();

  return feeder;
}
