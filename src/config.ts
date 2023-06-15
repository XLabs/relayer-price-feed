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
import { UpdateStrategy } from "./strategy";
import { TokenInfo } from "./feeder";
import { PriceFetcher } from "./prices";

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

export type FeederConfig = {
  env?: string;
  blockchainEnv?: string;
  logLevel?: string;
  priceFetcher?: PriceFetcher;
  strategy?: UpdateStrategy;
};
