import { ethers } from "ethers";
import { Logger } from "winston";
import { ContractUpdate, UpdateStrategy } from "./strategy";
import { GlobalConfig } from "./environment";
import { PriceFetcher, PricingData } from "./prices";
import { ChainId, coalesceChainName } from "@certusone/wormhole-sdk";

function getWallet(
  chainId: ChainId,
  globalConfig: GlobalConfig
): ethers.Signer {
  const pk = globalConfig.privateKeys.get(chainId);
  const rpc = globalConfig.rpcs.get(chainId);
  if (!pk) {
    throw new Error("No private key for chainId: " + chainId);
  }
  if (!rpc) {
    throw new Error("No rpc for chainId: " + chainId);
  }
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  return wallet;
}

export async function executeContractUpdates(
  strategy: UpdateStrategy,
  updates: ContractUpdate[],
  globalConfig: GlobalConfig,
  logger: Logger
) {
  logger.info("Starting price update executions for update: " + strategy.name);
  for (let contractUpdate of updates) {
    try {
      logger.info("Pulling signer for chainId: " + contractUpdate.chainId);
      const signer = getWallet(contractUpdate.chainId, globalConfig);
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
      strategy.reportPriceUpdateSuccess(
        coalesceChainName(contractUpdate.chainId)
      );
      await strategy.reportPriceUpdateGas(
        coalesceChainName(contractUpdate.chainId),
        receipt.gasUsed.toNumber()
      );
      reportContractPrices(strategy, updates);
    } catch (e) {
      logger.error(
        "Error executing price update for chainId: " +
          contractUpdate.chainId +
          " error: " +
          e
      );
      strategy.reportPriceUpdateFailure(
        coalesceChainName(contractUpdate.chainId)
      );
    }
  }
}

function reportContractPrices(
  strategy: UpdateStrategy,
  updates: ContractUpdate[]
) {
  for (let update of updates) {
    const updateData = update.updateData;
    for (let key of Object.keys(updateData)) {
      const isGasPrice = key === "gasPrice";
      const price = updateData[key];
      if (isGasPrice) {
        strategy.reportContractGasPrice(
          coalesceChainName(update.chainId),
          price
        );
      } else {
        strategy.reportContractNativePrice(
          coalesceChainName(update.chainId),
          price
        );
      }
    }
  }
}

export async function executePriceFetching(
  priceFetcher: PriceFetcher,
  logger: Logger
) {
  logger.info("Starting price fetching");
  let lastRun = 0;
  while (true) {
    await wait();
    const now = Date.now();
    if (now - lastRun > priceFetcher.runFrequencyMs()) {
      lastRun = now;
      try {
        await priceFetcher.updatePricingData();
        priceFetcher.reportPricePollingSuccess();
      } catch (e) {
        priceFetcher.reportPricePollingFailure();
        logger.error("Price fetcher process failed with error: " + e);
      }
    }
  }
}

export async function executeStrategy(
  strategy: UpdateStrategy,
  config: GlobalConfig,
  data: PricingData,
  logger: Logger
) {
  logger.info("Starting execution for strategy: " + strategy.name);
  let lastRun = 0;
  while (true) {
    await wait();
    const now = Date.now();
    if (now - lastRun > strategy.runFrequencyMs()) {
      lastRun = now;
      let updates: ContractUpdate[];

      try {
        if (data.isValid) {
          updates = await strategy.calculateUpdates(data);
        } else {
          logger.info(
            "Skipping execution for strategy: " +
              strategy.name +
              " as pricing data is invalid"
          );
          continue;
        }
      } catch (e) {
        logger.error(
          "Error calculating updates for strategy: " +
            strategy.name +
            " error: " +
            e
        );
        continue;
      }

      try {
        if (updates.length > 0) {
          await executeContractUpdates(strategy, updates, config, logger);
        } else {
          logger.info(
            "Skipping execution of contract updates for strategy: " +
              strategy.name +
              " as no updates were returned from the update calculation"
          );
        }
      } catch (e) {
        logger.error(
          "Error executing updates for strategy: " +
            strategy.name +
            " error: " +
            e
        );
        continue;
      }
    }
  }
}

export async function executeStrategies(
  strategies: UpdateStrategy[],
  config: GlobalConfig,
  data: PricingData,
  logger: Logger
) {
  logger.info("Starting execution for " + strategies.length + " strategies");
  for (let strategy of strategies) {
    await executeStrategy(strategy, config, data, logger);
  }
}

function wait() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}
