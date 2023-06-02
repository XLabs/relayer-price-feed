import { SupportedChainId } from "../config";

export type TxReceipt = {
  transactionHash: string;
};

export interface Wallet {
  getFeeData(): Promise<any>; // Should be ethers.Provier.FeeData
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

export interface ContractUpdater {
  executePriceUpdate(price: any): Promise<void>;
}

export class BasicContractUpdater implements ContractUpdater {
  public async executePriceUpdate(price: any): Promise<void> {
    // @TODO: Add actual implementation
    console.log(`Updating contracto with price: ${price}`);
  }
}
