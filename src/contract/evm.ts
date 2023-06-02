import { ethers } from "ethers";
import { SupportedChainId } from "../config";
import { Contract, TxReceipt, Wallet } from ".";

function relayerContract(
  address: string,
  signer: ethers.Signer
): ethers.Contract {
  const contract = new ethers.Contract(
    address,
    [
      "function swapRate(address) public view returns (uint256)",
      "function updateSwapRate(uint16,address,uint256) public",
      "function swapRatePrecision() public view returns (uint256)",
    ],
    signer
  );
  return contract;
}

export class EvmContract implements Contract {
    private evmContract: ethers.Contract;

    constructor(address: string, signer: ethers.Signer) {
        this.evmContract = relayerContract(address, signer);
    }

    public async swapRatePrecision(): Promise<BigInt> {
        return this.evmContract.swapRatePrecision(); 
    }

    public async swapRate(tokenAddress: string): Promise<BigInt> {
        return this.evmContract.swapRate(tokenAddress);
    }

    public async updateSwapRate(chainId: SupportedChainId, tokenAddress: string, newPrice: BigInt, overrides: any): Promise<TxReceipt> {
        const tx = await this.evmContract.updateSwapRate(chainId, tokenAddress, newPrice, overrides)
        return tx.wait();
    }
}

export class EvmWallet implements Wallet {
    wallet: ethers.Wallet;

    constructor(privateKey: string, rpcProviderUrl: string) {
        this.wallet = new ethers.Wallet(
            privateKey, 
            new ethers.providers.JsonRpcProvider(rpcProviderUrl)
        );
    }

    public async getFeeData(): Promise<any> {
        return this.wallet.getFeeData();
    }

    public async getGasPrice(): Promise<BigInt> {
        return (await this.wallet.getGasPrice()).toBigInt();
    }
}