import winston, { Logger } from "winston";
import { OracleConfig } from "./config";
import { CoingeckoPriceFetcher, FetcherError } from "./prices/fetcher";
import { SimpleUpdateStrategy } from "./strategy";
import { StrategyError } from "./strategy/error";

const defaultConfig: OracleConfig = {
    env: "prod",
    blockchainEnv: "mainnet",
    logLevel: "error",
    pricePollingIntervalMs: 60 * 1000,
    pricePrecision: 8,
}

// @TODO: Add tests
// @TODO: Better handling of default values to avoid typescript complains
export class GenericOracle {
    private config: OracleConfig;
    private logger: Logger;

    constructor(config: OracleConfig) {
        this.config = {...defaultConfig, ...config};
        this.validateConfig();
        this.logger = this.buildLogger();
        this.initDefaultComponents();
    }

    public async start(): Promise<void> {
        console.log(`Starting generic relayer...`);
        this.logger.info(`
            Starting relayer-price-oracle...
            Monitoring prices for: ${this.getTokenSymbols().join(",")}
            Price check interval: ${this.config.pricePollingIntervalMs}ms
        `);
        const { priceFetcher, strategy, supportedTokens } = this.config;

        while(true) {
            /**
             * Wait first and then execute. If something fails along the way
             * and we want to `continue` to the next loop cycle, it would be
             * nice to wait before trying again.
             */
            // @ts-ignore polling interval is defined
            this.sleep(this.config.pricePollingIntervalMs);

            try {
                // @ts-ignore priceFetcher is defined
                const updatedPrices = await priceFetcher.fetchPrices();
                // @ts-ignore strategy is defined
                strategy.pushNewPrices(updatedPrices);
            } catch (error: unknown) {
                if (error instanceof StrategyError) {
                    this.logger.error(`Error pushing new prices to the contract: ${error}.`);
                    continue;
                } else if (error instanceof FetcherError) {
                    this.logger.error(`Error getting new prices: ${error}`);
                    continue;
                }

                this.logger.error(`Unexpected error: ${error}`);
            }
        }
    }

    private validateConfig(): void {
        const requiredParams: string[] = [
            "supportedChains", 
            "supportedTokens", 
            "signers", 
            "relayerContracts"
        ];
        const keys = Object.keys(this.config);

        for (const param of requiredParams) {
            if (!keys.includes(param)) {
                throw new Error(`Missing parameter: ${param}.`)
            }
        }
    }

    private buildLogger(): Logger {
        return winston.createLogger({
            level: this.config.logLevel,
            format:
              this.config.env !== "local" ? winston.format.json() : winston.format.cli(),
            defaultMeta: { service: "token-bridge-price-oracle" },
            transports: [new winston.transports.Console()],
        });
    }

    private initDefaultComponents(): void {
        if (typeof this.config.priceFetcher === "undefined") {
            // This depends on coingeckoId property from the TokenInfo type, maybe is too explicit
            const supportedTokenIds: string[] = Array.from(
                new Set(this.config.supportedTokens?.map(token => token.coingeckoId))
            )

            this.config.priceFetcher = new CoingeckoPriceFetcher(supportedTokenIds, this.logger);
        }

        if (typeof this.config.strategy === "undefined") {
            this.config.strategy = new SimpleUpdateStrategy();
        }
    }

    private getTokenSymbols(): string[] {
        const symbols: string[] = Array.from(
            new Set(this.config.supportedTokens?.map(token => token.symbol))
        );

        return symbols;
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
}
