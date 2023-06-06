import winston, { Logger } from "winston";
import { OracleConfig } from "./config";
import { CoingeckoPriceFetcher, FetcherError } from "./prices/fetcher";
import { SimpleUpdateStrategy } from "./strategy";
import { StrategyError } from "./strategy/error";
import { BasicContractUpdater } from "./contract";

const defaultConfig: OracleConfig = {
  env: "prod",
  blockchainEnv: "mainnet",
  logLevel: "error",
  pricePollingIntervalMs: 60 * 1000,
  pricePrecision: 8,
};

// @TODO: Add tests
export class PriceOracle {
  private config: OracleConfig;
  private logger: Logger;

  constructor(config: OracleConfig) {
    const { mergedConfig, logger } = this.buildConfiguration(config);
    this.config = mergedConfig;
    this.logger = logger;
  }

  public async start(): Promise<void> {
    console.log(`Starting generic relayer...`);
    this.logger.info(`
            Starting relayer-price-oracle...
            Monitoring prices for: ${this.getTokenSymbols().join(",")}
            Price check interval: ${this.config.pricePollingIntervalMs}ms
        `);
    const { priceFetcher, strategy } = this.config;

    while (true) {
      /**
       * Wait first and then execute. If something fails along the way
       * and we want to `continue` to the next loop cycle, it would be
       * nice to wait before trying again.
       */
      this.sleep(this.config.pricePollingIntervalMs!);

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

  private buildConfiguration(config: OracleConfig): {
    mergedConfig: OracleConfig;
    logger: Logger;
  } {
    const mergedConfig = { ...defaultConfig, ...config };
    const logger = this.buildLogger(mergedConfig.env!, mergedConfig.logLevel!);

    if (!mergedConfig.supportedChains) {
      throw new Error(`Missing parameter: supportedChains.`);
    }

    if (!mergedConfig.supportedTokens) {
      throw new Error(`Missing parameter: supportedTokens.`);
    }

    if (!mergedConfig.tokenNativeToLocalAddress) {
      throw new Error(`Missing parameter: tokenNativeToLocalAddress.`);
    }

    if (!mergedConfig.signers) {
      throw new Error(`Missing parameter: signers.`);
    }

    if (!mergedConfig.relayerContracts) {
      throw new Error(`Missing parameter: relayerContracts.`);
    }

    if (!mergedConfig.priceFetcher) {
      throw new Error(`Missing parameter: priceFetcher.`);
    }

    if (!mergedConfig.strategy) {
      let contractUpdater =
        mergedConfig.contractUpdater ??
        new BasicContractUpdater(logger, mergedConfig.signers);

      mergedConfig.strategy = new SimpleUpdateStrategy(
        logger,
        contractUpdater,
        {
          supportedChainIds: mergedConfig.supportedChains,
          supportedTokens: mergedConfig.supportedTokens,
          tokenNativeToLocalAddress: mergedConfig.tokenNativeToLocalAddress,
          relayerContracts: mergedConfig.relayerContracts,
          pricePrecision: mergedConfig.pricePrecision!,
          maxPriceChangePercentage: 1, // @TODO: Find a proper value for this
          minPriceChangePercentage: 0, // @TODO: Also here
        }
      );
    }

    return { mergedConfig, logger };
  }

  private buildLogger(env: string, logLevel: string): Logger {
    return winston.createLogger({
      level: logLevel,
      format: env !== "local" ? winston.format.json() : winston.format.cli(),
      defaultMeta: { service: "token-bridge-price-oracle" },
      transports: [new winston.transports.Console()],
    });
  }

  private getTokenSymbols(): string[] {
    const symbols: string[] = Array.from(
      new Set(this.config.supportedTokens?.map((token) => token.symbol))
    );

    return symbols;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
