import { Logger } from "winston";
import { SupportedChainId } from "../config";
import {
  CHAIN_ID_FANTOM,
  CHAIN_ID_POLYGON,
  isEVMChain,
} from "@certusone/wormhole-sdk";

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

export interface ContractUpdater {
  executePriceUpdate(
    contract: Contract,
    chainId: SupportedChainId,
    tokenAddress: string,
    price: BigInt
  ): Promise<void>;
}

export class BasicContractUpdater implements ContractUpdater {
  constructor(
    private readonly logger: Logger,
    private readonly signers: Record<SupportedChainId, Wallet>
  ) {}

  public async executePriceUpdate(
    contract: Contract,
    chainId: SupportedChainId,
    tokenAddress: string,
    price: BigInt
  ): Promise<void> {
    let overrides = {};
    if (isEVMChain(chainId)) {
      overrides = await this.calculateGasOverrideForChain(
        chainId,
        this.signers[chainId]
      );
    }

    const txReceipt = await contract.updateSwapRate(
      chainId,
      tokenAddress,
      price,
      overrides
    );
    this.logger.info(
      `Updated native price on chainId: ${chainId}, token: ${tokenAddress}, txhash: ${txReceipt.transactionHash}`
    );
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
}
