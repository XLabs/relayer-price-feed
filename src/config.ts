import {
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_FANTOM,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_POLYGON,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { PriceFetcher } from "./prices/fetcher";
import { UpdateStrategy } from "./strategy";

export const SUPPORTED_CHAIN_IDS = [
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_FANTOM,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_POLYGON,
  // @TODO: Enable sui support again CHAIN_ID_SUI,
];

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];
export type SupportedWallet = ethers.Wallet; // @TODO: Enable sui support again | RawSigner;

export type TokenInfo = {
  chainId: number;
  symbol: string;
  tokenContract: string;
  coingeckoId: string; // @TODO: should this be removed and considered an implementation detail?
};

export type OracleConfig = {
  env?: string;
  blockchainEnv?: string;
  logLevel?: string;
  priceFetcher?: PriceFetcher;
  strategy?: UpdateStrategy;
};
