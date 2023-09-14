import { ChainId, coalesceChainName } from "@certusone/wormhole-sdk";
import {
  UpdateStrategy,
  GlobalConfig,
  executePriceFetching,
  executeStrategies,
  CoingeckoTokenInfo,
  CoingeckoPriceFetcher,
  CoingeckoProviderOptions,
  PricingData,
  ContractUpdate,
} from "../src";
import { Logger, createLogger, format, transports } from "winston";
import { ethers } from "ethers";

//Start! Set up the global configuration object

//TODO read env
//const globalConfig : GlobalConfig = process.env.ENV === "tilt" ? require("./config/tilt.json") : {};

const rpcs = new Map<ChainId, string>([
  [2, "https://endpoints.omniatech.io/v1/eth/goerli/public"],
  [4, "https://bsc-testnet.publicnode.com"],
  [6, "https://avalanche-fuji-c-chain.publicnode.com"],
]);

const privateKeys = new Map<ChainId, string>([
  //These are the owner keys of the contracts in tilt
  [2, "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"],
  [4, "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"],
  [6, "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"],
]);

const contracts = new Map<ChainId, string>([
  [2, "0x1ef9e15c3bbf0555860b5009B51722027134d53a"],
  [4, "0x1ef9e15c3bbf0555860b5009B51722027134d53a"],
  [6, "0x1ef9e15c3bbf0555860b5009B51722027134d53a"],
]);

const tokens: CoingeckoTokenInfo[] = [
  {
    chainId: 2,
    symbol: "ETH",
    address: "",
    coingeckoId: "ethereum",
  },
  {
    chainId: 4,
    symbol: "BNB",
    address: "",
    coingeckoId: "binancecoin",
  },
  {
    chainId: 6,
    symbol: "AVAX",
    address: "",
    coingeckoId: "avalanche-2",
  },
];

const globalConfig = {
  rpcs,
  privateKeys,
  tokens,
};
const logger = createLogger({
  level: "debug",
  transports: [new transports.Console()],
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
});

//Next up, configure the price fetching process and run it!
const providerConfig: CoingeckoProviderOptions = {
  tokens,
  rpcs,
};

const provider = new CoingeckoPriceFetcher(logger, providerConfig);
executePriceFetching(provider, logger);

//Finally, configure all the strategies and then run them!
class DemoStrategy implements UpdateStrategy {
  logger: Logger;
  config: GlobalConfig;
  name: string = "Demo strategy";

  constructor(logger: Logger, globalConfig: GlobalConfig) {
    this.logger = logger;
    this.config = globalConfig;
  }

  runFrequencyMs(): number {
    return 5 * 1000; // 5 seconds
  }

  async calculateUpdates(pricingData: PricingData): Promise<ContractUpdate[]> {
    const updates: ContractUpdate[] = [];
    this.logger.info("Price data: ", pricingData.isValid);
    for (const [chainId, price] of pricingData.nativeTokens.entries()) {
      this.logger.info(
        `Native token price for ${coalesceChainName(chainId)}: ${price}`
      );
    }
    for (const [chainId, price] of pricingData.gasPrices.entries()) {
      this.logger.info(`Gas price for ${coalesceChainName(chainId)}: ${price}`);
    }
    return updates;
  }

  async pushUpdate(
    signer: ethers.Signer,
    update: ContractUpdate
  ): Promise<ethers.providers.TransactionResponse> {
    const tx = <ethers.providers.TransactionResponse>{};
    return tx;
  }

  reportPriceUpdate(chainName: string, params: { status: string }): void {
    // do nothing,
  }

  async reportPriceUpdateGas(chainName: string, gas: number): Promise<void> {
    // do nothing
  }

  reportContractPrice(
    chainName: string,
    price: number,
    params: { isGasPrice: boolean }
  ): void {
    // do nothing
  }

  getMetrics(): Promise<string> {
    return Promise.resolve("");
  }
}

const allStrategies: UpdateStrategy[] = [];
allStrategies.push(new DemoStrategy(logger, globalConfig));

executeStrategies(
  allStrategies,
  globalConfig,
  provider.getPricingData(),
  logger
);
