import { SupportedChainId } from "../config";

export type TxReceipt = {
  transactionHash: string;
};

export interface Wallet {
  getFeeData(): Promise<any>; // Should be ethers.Provider.FeeData
  getGasPrice(): Promise<BigInt>;
}

export interface Contract {
  swapRatePrecision(): Promise<BigInt>;
  swapRate(tokenAddress: string): Promise<BigInt>;
  updateSwapRate(
    chainId: SupportedChainId,
    tokenAddress: string,
    newPrice: BigInt,
    options: any
  ): Promise<TxReceipt>;
}
