import { ChainId } from "@certusone/wormhole-sdk";

//TODO export * from "./coinGeckoFetcher";
export * from "./fixedPriceFetcher";



export type PricingData = { isValid: boolean, 
    nativeTokens: Map<ChainId, number>,
};

export function getDefaultPricingData(): PricingData {
  return {
    isValid: false,
    nativeTokens: new Map<ChainId, number>(),
  };
}

export type PriceFetcher = {
    getPricingData(): PricingData;
    updatePricingData(): Promise<void>;
    runFrequencyMs(): number;
}