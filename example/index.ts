import { CHAIN_ID_ETH, CHAIN_ID_AVAX } from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import {
  SupportedChainId,
  Wallet,
  Contract,
  EvmWallet,
  EvmContract,
  CoingeckoPriceFetcher,
  PriceOracle,
  UpdateStrategy,
  TokenInfo,
  GlobalConfig,
  StrategyConfig,
  UpdateAction,
  PricingData,
} from "relayer-price-oracle";
import { Logger } from "winston";

const supportedTokens = [
  {
    chainId: 14,
    symbol: "CELO",
    address: "000000000000000000000000C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    coingeckoId: "celo",
  },
  {
    chainId: 4,
    symbol: "BNB",
    address: "000000000000000000000000A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    coingeckoId: "binancecoin",
  },
  {
    chainId: 5,
    symbol: "MATIC",
    address: "000000000000000000000000dAC17F958D2ee523a2206206994597C13D831ec7",
    coingeckoId: "matic-network",
  },
  {
    chainId: 6,
    symbol: "AVAX",
    address: "000000000000000000000000B31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    coingeckoId: "avalanche-2",
  },
  {
    chainId: 16,
    symbol: "GLMR",
    address: "000000000000000000000000C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    coingeckoId: "moonbeam",
  },
];

class DummyStrategy implements UpdateStrategy {
  private logger: Logger | undefined;

  public pushUpdates<PricingData, GlobalConfig, UpdateAction>(
    priceData: PricingData,
    config: GlobalConfig
  ): Promise<UpdateAction> {
    this.logger!.info("Dummy strategy: " + JSON.stringify(priceData));
    return Promise.resolve({
      getTransactions(): ethers.Transaction[] {
        return [];
      },
    } as UpdateAction);
  }

  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  public runFrequencyMs(): number {
    return 10 * 1000; // 10 seconds
  }

  public tokenList(): TokenInfo[] {
    return [];
  }

  getConfig<StrategyConfig>(env: GlobalConfig): Promise<StrategyConfig> {
    return Promise.resolve({
      supportedChainIds: [CHAIN_ID_ETH, CHAIN_ID_AVAX],
      relayerContracts: {
        [CHAIN_ID_ETH]: new EvmContract(
          "eth_address",
          ethers.Wallet.createRandom()
        ),
      },
    } as StrategyConfig);
  }
}

// const signers: Record<SupportedChainId, Wallet> = {
//   [CHAIN_ID_ETH]: new EvmWallet("pk", "rcpProviderUrl"),
//   [CHAIN_ID_AVAX]: new EvmWallet("pk", "rcpProvider"),
// };

// const relayerContracts: Record<SupportedChainId, Contract> = {
//   [CHAIN_ID_ETH]: new EvmContract("eth_address", signers[CHAIN_ID_ETH]),
//   [CHAIN_ID_AVAX]: new EvmContract("avax_address", signers[CHAIN_ID_AVAX]),
// };

// This depends on coingeckoId property from the TokenInfo type, maybe is too explicit
const supportedTokenIds: string[] = Array.from(
  new Set(supportedTokens?.map((token) => token.coingeckoId))
);

const priceFetcher = new CoingeckoPriceFetcher(supportedTokens);
const strategy = new DummyStrategy();
// const strategy = new SimpleUpdateStrategy({
//   supportedChains: [CHAIN_ID_ETH, CHAIN_ID_AVAX],
//   supportedTokens,
//   signers,
//   relayerContracts,
//   tokenNativeToLocalAddress: map, // @TODO: deal with token map later
//   pollingIntervalMs: 60 * 1000,
//   pricePrecision: 8,
// });

const oracle = new PriceOracle({
  env: "local",
  logLevel: "info",
  priceFetcher,
  strategy,
});

oracle.start();
