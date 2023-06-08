import { ethers } from "ethers";
import { SupportedChainId } from "../config";
import { Logger } from "winston";
import { ContractUpdate, UpdateStrategy } from "../strategy";

function getWallet(chainId: SupportedChainId): ethers.Signer {
  //TODO this should be pulled from a global env, or use the wallet management library.
  return new ethers.Wallet("0x1234");
}

export async function executeContractUpdate(
  strategy: UpdateStrategy,
  updates: ContractUpdate[],
  logger: Logger
) {
  logger.info("Starting price update executions for update: " + strategy.name);
  for (let contractUpdate of updates) {
    try {
      logger.info("Pulling signer for chainId: " + contractUpdate.chainId);
      const signer = getWallet(contractUpdate.chainId);
      logger.info("Sending transaction for chainId: " + contractUpdate.chainId);
      const tx = await strategy.pushUpdate(signer, contractUpdate);
      logger.info(
        "Transaction sent for chainId: " +
          contractUpdate.chainId +
          " txHash: " +
          tx.hash
      );
      const receipt = await tx.wait();
      logger.info("Result of transaction is: " + receipt.status);
    } catch (e) {
      logger.error(
        "Error executing price update for chainId: " +
          contractUpdate.chainId +
          " error: " +
          e
      );
    }
  }
}
