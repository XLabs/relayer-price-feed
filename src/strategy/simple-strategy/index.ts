
export type SimpleStrategyConfig = {
    supportedChainIds: SupportedChainId[];
    supportedTokens: TokenInfo[];
    signers: Record<SupportedChainId, Wallet>;
    relayerContracts: Record<SupportedChainId, Contract>;
    tokenNativeToLocalAddress: Record<SupportedChainId, Record<string, string>>;
    pollingIntervalMs: number;
    pricePrecision: number;
    maxPriceChangePercentage: number; // upper band
    minPriceChangePercentage: number; // lower band
  };
  
  export class SimpleUpdateStrategy {
    private logger: Logger | undefined;
    constructor(private readonly config: SimpleStrategyConfig) {}
  
    public setLogger(logger: Logger): void {
      this.logger = logger;
    }
  
    public pollingIntervalMs(): number {
      return this.config.pollingIntervalMs;
    }
  
    public tokenList(): TokenInfo[] {
      return this.config.supportedTokens;
    }
  
    public async pushUpdates(prices: Map<string, BigInt>): Promise<void> {
      for (const chainId of this.config.supportedChainIds) {
        const contract = this.config.relayerContracts[chainId];
  
        for (const token of this.config.supportedTokens) {
          // const tokenAddress =
          //   this.config.tokenNativeToLocalAddress[chainId][token.tokenContract];
          // const currentPrice: BigInt = await contract.swapRate(tokenAddress);
          // const newPrice: BigInt = prices.get(token.coingeckoId)!;
          // const pricePercentageChange: number = Math.abs(
          //   ((Number(newPrice) - Number(currentPrice)) / Number(currentPrice)) *
          //     100
          // );
          // const newPriceFormatted = ethers.utils.formatUnits(
          //   ethers.BigNumber.from(newPrice.toString()),
          //   this.config.pricePrecision
          // );
          // const currentPriceFormatted = ethers.utils.formatUnits(
          //   ethers.BigNumber.from(currentPrice.toString()),
          //   this.config.pricePrecision
          // );
          // if (pricePercentageChange >= this.config.maxPriceChangePercentage) {
          //   this.log(
          //     "warn",
          //     `Price change larger than max (current: ${currentPriceFormatted}, new: ${newPriceFormatted}), chainId: ${chainId}, token: ${tokenAddress} (${token.symbol}). Skipping update.`
          //   );
          //   continue;
          // } else if (
          //   pricePercentageChange < this.config.minPriceChangePercentage
          // ) {
          //   this.log(
          //     "debug",
          //     `Price change too small (current: ${currentPriceFormatted}, new: ${newPriceFormatted}), chainId: ${chainId}, token: ${tokenAddress} (${token.symbol}). Skipping update.`
          //   );
          // }
          // this.log(
          //   "info",
          //   `Executing price update in ${coalesceChainName(chainId)}: ${
          //     token.symbol
          //   } going from ${currentPriceFormatted} to ${newPriceFormatted} (${pricePercentageChange.toFixed(
          //     2
          //   )}%).`,
          //   {
          //     chainId,
          //     nativeAddress: token.tokenContract,
          //     localTokenAddress: tokenAddress,
          //     currentPrice: currentPrice,
          //     newPrice: newPrice,
          //     symbol: token.symbol,
          //   }
          // );
          // await this.executePriceUpdate(
          //   contract,
          //   chainId,
          //   tokenAddress,
          //   newPrice
          // );
        }
      }
    }
  
    private async executePriceUpdate(
      contract: Contract,
      chainId: SupportedChainId,
      tokenAddress: string,
      newPrice: BigInt
    ): Promise<void> {
      try {
        let overrides = {};
        if (isEVMChain(chainId)) {
          overrides = await this.calculateGasOverrideForChain(
            chainId,
            this.config.signers[chainId]
          );
        }
        const txReceipt = await contract.updateSwapRate(
          chainId,
          tokenAddress,
          newPrice,
          overrides
        );
  
        this.log(
          "info",
          `Updated native price on chainId: ${chainId}, token: ${tokenAddress}, txhash: ${txReceipt.transactionHash}`
        );
      } catch (e: any) {
        this.log(
          "error",
          `Error updating price in ${coalesceChainName(chainId)}: ${e.message}`,
          {
            chainId,
            tokenAddress,
            newPrice,
          }
        );
      }
    }
  
    // This is Gabriel's code from TBR
    // ethers.js does not properly calculate priority fees or gas price for some chains (I'm specially looking at you polygon).
    private async calculateGasOverrideForChain(
      chainId: SupportedChainId,
      signer: Wallet
    ) {
      let overrides: any = {}; // TODO: Find out type
      if (chainId === CHAIN_ID_POLYGON) {
        // look, there's something janky with Polygon + ethers + EIP-1559
        let feeData = await signer.getFeeData();
        overrides = {
          maxFeePerGas: feeData.maxFeePerGas?.mul(70) || undefined,
          maxPriorityFeePerGas:
            feeData.maxPriorityFeePerGas?.mul(70) || undefined,
        };
      } else if (chainId == CHAIN_ID_FANTOM) {
        // || toChain === CHAIN_ID_KLAYTN <-- Add this when we support klaytn
        overrides = {
          gasPrice: (await signer.getGasPrice()).toString(),
        };
      }
      return overrides;
    }
  
    private log(level: string, message: string, ...meta: any[]): void {
      if (this.logger) {
        this.logger.log(level, message, meta);
      }
    }
  }