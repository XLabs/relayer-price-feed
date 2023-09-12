import { ChainId } from "@certusone/wormhole-sdk";
import { BigNumber } from "ethers";

export * from "./coinGeckoFetcher";
export * from "./fixedPriceFetcher";

export type TokenInfo = {
  chainId: ChainId;
  address: string;
  symbol: string;
};

export type PricingData = {
  isValid: boolean;
  nativeTokens: Map<ChainId, BigNumber>;
  gasPrices: Map<ChainId, BigNumber>;
};

export function getDefaultPricingData(): PricingData {
  return {
    isValid: false,
    nativeTokens: new Map<ChainId, BigNumber>(),
    gasPrices: new Map<ChainId, BigNumber>(),
  };
}

export type PollingStatus = "success" | "failed";

export type PriceFetcher = {
  getPricingData(): PricingData;
  updatePricingData(): Promise<void>;
  runFrequencyMs(): number;
  reportPricePolling(params: { status: PollingStatus }): void;
  reportProviderPrice(token: string, price: number): void;
  getMetrics(): Promise<string>;
};
