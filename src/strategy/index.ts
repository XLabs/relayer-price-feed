import { ethers } from "ethers";
import { Contract, ContractUpdater } from "../contract";
import { SupportedChainId, TokenInfo } from "../config";
import { Logger } from "winston";
import { coalesceChainName } from "@certusone/wormhole-sdk";

export interface UpdateStrategy {
  pushNewPrices(prices: Map<string, BigInt>): Promise<void>;
}

export type SimpleStrategyConfig = {
  supportedChainIds: SupportedChainId[];
  supportedTokens: TokenInfo[];
  tokenNativeToLocalAddress: Record<SupportedChainId, Record<string, string>>;
  relayerContracts: Record<SupportedChainId, Contract>;
  pricePrecision: number;
  maxPriceChangePercentage: number; // upper band
  minPriceChangePercentage: number; // lower band
};

export class SimpleUpdateStrategy implements UpdateStrategy {
  constructor(
    private readonly logger: Logger,
    private readonly updater: ContractUpdater,
    private readonly config: SimpleStrategyConfig
  ) {}

  public async pushNewPrices(prices: Map<string, BigInt>): Promise<void> {
    if (!this.updater) {
      throw new Error(
        "A contract updater should be provided before pushing price updates."
      );
    }

    for (const chainId of this.config.supportedChainIds) {
      const contract = this.config.relayerContracts[chainId];

      for (const token of this.config.supportedTokens) {
        const tokenAddress =
          this.config.tokenNativeToLocalAddress[chainId][token.tokenContract];

        const currentPrice: BigInt = await contract.swapRate(tokenAddress);
        const newPrice: BigInt = prices.get(token.coingeckoId)!;

        const pricePercentageChange: number = Math.abs(
          ((Number(newPrice) - Number(currentPrice)) / Number(currentPrice)) *
            100
        );

        const newPriceFormatted = ethers.utils.formatUnits(
          ethers.BigNumber.from(newPrice.toString()),
          this.config.pricePrecision
        );
        const currentPriceFormatted = ethers.utils.formatUnits(
          ethers.BigNumber.from(currentPrice.toString()),
          this.config.pricePrecision
        );

        if (pricePercentageChange >= this.config.maxPriceChangePercentage) {
          this.logger.warn(
            `Price change larger than max (current: ${currentPriceFormatted}, new: ${newPriceFormatted}), chainId: ${chainId}, token: ${tokenAddress} (${token.symbol}). Skipping update.`
          );
          continue;
        } else if (
          pricePercentageChange < this.config.minPriceChangePercentage
        ) {
          this.logger.debug(
            `Price change too small (current: ${currentPriceFormatted}, new: ${newPriceFormatted}), chainId: ${chainId}, token: ${tokenAddress} (${token.symbol}). Skipping update.`
          );
          continue;
        }

        this.logger.info(
          `Executing price update in ${coalesceChainName(chainId)}: ${
            token.symbol
          } going from ${currentPriceFormatted} to ${newPriceFormatted} (${pricePercentageChange.toFixed(
            2
          )}%).`,
          {
            chainId,
            nativeAddress: token.tokenContract,
            localTokenAddress: tokenAddress,
            currentPrice: currentPrice,
            newPrice: newPrice,
            symbol: token.symbol,
          }
        );
        this.updater.executePriceUpdate(
          contract,
          chainId,
          tokenAddress,
          newPrice
        );
      }
    }
  }
}
