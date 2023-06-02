import { CHAIN_ID_ETH, CHAIN_ID_AVAX } from "@certusone/wormhole-sdk";
import { 
    GenericOracle, 
    SupportedChainId, 
    Wallet, 
    Contract,
    EvmWallet,
    EvmContract
} from "relayer-price-oracle";


const supportedTokens = [
    {
        chainId: 2,
        symbol: "WETH",
        tokenContract: "000000000000000000000000C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        coingeckoId: "ethereum",
      },
      {
        chainId: 2,
        symbol: "USDC",
        tokenContract: "000000000000000000000000A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        coingeckoId: "usd-coin",
      },
      {
        chainId: 2,
        symbol: "USDT",
        tokenContract: "000000000000000000000000dAC17F958D2ee523a2206206994597C13D831ec7",
        coingeckoId: "tether",
      },
      {
        chainId: 6,
        symbol: "AVAX",
        tokenContract: "000000000000000000000000B31f66AA3C1e785363F0875A1B74E27b85FD66c7",
        coingeckoId: "avalanche-2",
      },
];

const signers: Record<SupportedChainId, Wallet> = {
    [CHAIN_ID_ETH]: new EvmWallet("pk", "rcpProviderUrl"),
    [CHAIN_ID_AVAX]: new EvmWallet("pk", "rcpProvider"),
}

const relayerContracts: Record<SupportedChainId, Contract> = {
    [CHAIN_ID_ETH]: new EvmContract("eth_address", signers[CHAIN_ID_ETH]),
    [CHAIN_ID_AVAX]: new EvmContract("avax_address", signers[CHAIN_ID_AVAX]),
}

const oracle = new GenericOracle({
    supportedChains: [CHAIN_ID_ETH, CHAIN_ID_AVAX],
    supportedTokens,
    signers,
    relayerContracts,
});

oracle.start();
