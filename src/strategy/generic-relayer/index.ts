import { BigNumber, ethers } from "ethers";
import { ContractUpdate, UpdateStatus, UpdateStrategy } from "../index";
import { Logger } from "winston";
import { GlobalConfig } from "../../environment";
import { PricingData } from "../../prices";
import { ChainId, coalesceChainName } from "@certusone/wormhole-sdk";
import { DeliveryProviderStructs } from "./tmp/DeliveryProvider";
import { DeliveryProvider__factory } from "./tmp/DeliveryProvider__factory";
import * as fs from "fs";
import { PrometheusExporter } from "../../prometheus";

//This configuration will become much more complex over time,
//The first logical addition would be to allow different configurations on different corridors.
export type GenericRelayerStrategyConfig = {
  contractAddresses: Map<ChainId, string>;
  gasPriceTolerance: number; //The amount gas can move without triggering an update, ex. .05 = 5%
  nativePriceTolerance: number; //The amount native price can move without triggering an update, ex. .05 = 5%
  gasPriceMarkup: number; //The amount gas is marked up by when updating, ex. .05 = 5%
  maxIncrease: number; //The maximum amount a value can increase by without triggering the safeguard
  maxDecrease: number; //The maximum amount a value can decrease by without triggering the safeguard
  overrideSafeGuard: boolean; //If true, the maxIncrease and maxDecrease values are ignored.
};

export type GenericRelayerStrategyUpdateData = {
  contractAddress: string;
  priceInfos: GenRelayerPriceInfo[];
};

interface GenRelayerPriceInfo {
  chainId: ChainId;
  priceData: { gasPrice: BigNumber; nativePrice: BigNumber } | null;
}

//This module should be treated as a singleton
export class GenericRelayerStrategy implements UpdateStrategy {
  public name = "GenericRelayerStrategy";
  logger: Logger;
  globalConfig: GlobalConfig;
  config: GenericRelayerStrategyConfig;
  exporter?: PrometheusExporter;

  constructor(
    config: GenericRelayerStrategyConfig,
    globalConfig: GlobalConfig,
    logger: Logger,
    metricsExporter?: PrometheusExporter
  ) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.logger = logger;
    this.exporter = metricsExporter;
  }

  public static loadConfig(path: string): GenericRelayerStrategyConfig {
    const file = fs.readFileSync(path, "utf-8");
    const config = JSON.parse(file);

    const contractAddresses = new Map<ChainId, string>();
    for (const [chainId, address] of Object.entries(config.contractAddresses)) {
      contractAddresses.set(parseInt(chainId) as ChainId, address as any);
    }
    const gasPriceTolerance = config.gasPriceTolerance;
    const nativePriceTolerance = config.nativePriceTolerance;
    const gasPriceMarkup = config.gasPriceMarkup;
    const maxIncrease = config.maxIncrease;
    const maxDecrease = config.maxDecrease;
    const overrideSafeGuard = !!config.overrideSafeGuard;

    if (
      !gasPriceTolerance ||
      !nativePriceTolerance ||
      !gasPriceMarkup ||
      !maxIncrease ||
      !maxDecrease
    ) {
      throw new Error("Invalid config file supplied to GenericRelayerStrategy");
    }

    return {
      contractAddresses,
      gasPriceTolerance,
      nativePriceTolerance,
      gasPriceMarkup,
      maxIncrease,
      maxDecrease,
      overrideSafeGuard,
    };
  }

  public runFrequencyMs(): number {
    return 1000;
  }

  public async calculateUpdates(
    pricingData: PricingData
  ): Promise<ContractUpdate[]> {
    //first, pull all the contract states.
    const contractStates: Map<ChainId, GenRelayerPriceInfo[]> =
      await this.readContractStates();

    const output: ContractUpdate[] = [];
    //go through every chain in the configuration and see if it needs any updates.
    for (const chainId of this.config.contractAddresses.keys()) {
      const contractState = contractStates.get(chainId);
      if (contractState === undefined) {
        this.logger.error(`No contract state found for chainId ${chainId}`);
        //If we fail to pull a contract state, we simply ignore that chain, rather than tanking
        //the entire process.
        continue;
        //throw new Error(`No contract state found for chainId ${chainId}`);
      }

      const priceDiscrepancies: GenRelayerPriceInfo[] =
        this.calculateRequiredUpdates(contractState, pricingData);
      if (priceDiscrepancies.length > 0) {
        output.push({
          chainId: chainId,
          updateData: {
            contractAddress: this.config.contractAddresses.get(
              chainId
            ) as string,
            priceInfos: priceDiscrepancies,
          },
        });
      }
    }

    return output;
  }

  //Currently mutates the state of this class,
  //but could easily be made to return the contract state result.
  private async readContractStates(): Promise<
    Map<ChainId, GenRelayerPriceInfo[]>
  > {
    const contractStates: Map<ChainId, GenRelayerPriceInfo[]> = new Map<
      ChainId,
      GenRelayerPriceInfo[]
    >();

    for (const chainId of this.config.contractAddresses.keys()) {
      const rpc = this.globalConfig.rpcs.get(chainId);
      const contractAddress = this.config.contractAddresses.get(chainId);
      if (!rpc) {
        this.logger.error(
          `Generic Relayer readContractState expected and RPC url but found none: chainId ${chainId}`
        );
        continue;
      }
      if (!contractAddress) {
        this.logger.error(
          `Generic Relayer readContractState expected a contract address but found none: chainId ${chainId}`
        );
        continue;
      }

      const ethersProvider = new ethers.providers.JsonRpcProvider(rpc);
      const deliveryProvider = DeliveryProvider__factory.connect(
        contractAddress,
        ethersProvider
      );

      for (const deliveryChainId of this.config.contractAddresses.keys()) {
        const gasPrice = await deliveryProvider.gasPrice(deliveryChainId);
        const nativePrice = await deliveryProvider.nativeCurrencyPrice(
          deliveryChainId
        );
        if (
          gasPrice === null ||
          nativePrice === null ||
          gasPrice === undefined ||
          nativePrice === undefined
        ) {
          this.logger.error(
            `Generic Relayer readContractState failed to pull gas price or native price for delivery chainId ${deliveryChainId} from chainId ${chainId}`
          );
          continue;
        }
        const priceInfo: GenRelayerPriceInfo = {
          chainId: deliveryChainId,
          priceData: { gasPrice: gasPrice, nativePrice: nativePrice },
        };
        let priceInfos = contractStates.get(chainId);
        if (priceInfos === undefined) {
          priceInfos = [];
          contractStates.set(chainId, priceInfos);
        }
        priceInfos.push(priceInfo);
        this.reportContractPrice(
          coalesceChainName(deliveryChainId),
          nativePrice.toNumber(),
          { isGasPrice: false }
        );
        this.reportContractPrice(
          coalesceChainName(deliveryChainId),
          gasPrice.toNumber(),
          { isGasPrice: true }
        );
      }
    }

    return contractStates;
  }

  private calculateRequiredUpdates(
    contractState: GenRelayerPriceInfo[],
    pricingData: PricingData
  ): GenRelayerPriceInfo[] {
    const requiredUpdates: GenRelayerPriceInfo[] = [];

    for (const priceInfo of contractState) {
      const newNativePrice = pricingData.nativeTokens.get(priceInfo.chainId);
      const rawNewGasPrice = pricingData.gasPrices.get(priceInfo.chainId);

      if (newNativePrice === undefined) {
        this.logger.error(
          `No native price found for chainId ${priceInfo.chainId}`
        );
        //Don't tank the process, just skip this
        continue;
        //throw new Error(`No native price found for chainId ${priceInfo.chainId}`);
      }
      if (rawNewGasPrice === undefined) {
        this.logger.error(
          `No gas price found for chainId ${priceInfo.chainId}`
        );
        //Don't tank the process, just skip this
        continue;
        //throw new Error(`No gas price found for chainId ${priceInfo.chainId}`);
      }

      const markedUpGasPrice = this.ethersMul(
        rawNewGasPrice,
        this.config.gasPriceMarkup + 1
      );

      if (priceInfo.priceData === null) {
        this.logger.error(
          `Price data object was null for chainId ${priceInfo.chainId}`
        );
        //Don't tank the process, just skip this
        continue;
        //throw new Error(`Price data object was null for chainId ${priceInfo.chainId}`);
      }

      const nativePriceDelta = newNativePrice
        .sub(priceInfo.priceData.nativePrice)
        .abs();
      const gasPriceDelta = markedUpGasPrice
        .sub(priceInfo.priceData.gasPrice)
        .abs();

      const nativePriceTolerance = this.ethersMul(
        priceInfo.priceData.nativePrice,
        this.config.nativePriceTolerance
      );
      const gasPriceTolerance = this.ethersMul(
        priceInfo.priceData.gasPrice,
        this.config.gasPriceTolerance
      );

      if (!this.config.overrideSafeGuard) {
        const newMaxNativePrice = this.ethersMul(
          priceInfo.priceData.nativePrice,
          this.config.maxIncrease + 1
        );
        const newMinNativePrice = this.ethersMul(
          priceInfo.priceData.nativePrice,
          1 - this.config.maxDecrease
        );
        if (
          newNativePrice.gt(newMaxNativePrice) ||
          newNativePrice.lt(newMinNativePrice)
        ) {
          this.logger.error(
            `New native price ${newNativePrice.toString()} is outside of bounds for chainId ${
              priceInfo.chainId
            }`
          );
          continue;
        }

        const newMaxGasPrice = this.ethersMul(
          priceInfo.priceData.gasPrice,
          this.config.maxIncrease + 1
        );
        const newMinGasPrice = this.ethersMul(
          priceInfo.priceData.gasPrice,
          1 - this.config.maxDecrease
        );
        if (
          markedUpGasPrice.gt(newMaxGasPrice) ||
          markedUpGasPrice.lt(newMinGasPrice)
        ) {
          this.logger.error(
            `New gas price ${markedUpGasPrice.toString()} is outside of bounds for chainId ${
              priceInfo.chainId
            }`
          );
          continue;
        }
      }

      if (
        nativePriceDelta.gt(nativePriceTolerance) ||
        gasPriceDelta.gt(gasPriceTolerance)
      ) {
        requiredUpdates.push({
          chainId: priceInfo.chainId,
          priceData: {
            nativePrice: newNativePrice,
            gasPrice: markedUpGasPrice,
          },
        });
      }
    }

    return requiredUpdates;
  }

  public async pushUpdate(
    signer: ethers.Signer,
    update: ContractUpdate
  ): Promise<ethers.providers.TransactionResponse> {
    //TODO this actually isn't right, should instatiate the delivery provider type instead
    const targetContractAddress = this.config.contractAddresses.get(
      update.chainId
    );
    if (targetContractAddress === undefined) {
      this.logger.error(
        `No contract address found for chainId ${update.chainId}`
      );
      throw new Error(
        `No contract address found for chainId ${update.chainId}`
      );
    }

    const contract = DeliveryProvider__factory.connect(
      targetContractAddress,
      signer
    );

    const transactionUpdateArray: DeliveryProviderStructs.UpdatePriceStruct[] =
      [];

    for (const priceInfo of update.updateData
      .priceInfos as GenRelayerPriceInfo[]) {
      if (priceInfo.priceData === null) {
        this.logger.error(
          `Price data object was null for chainId ${priceInfo.chainId}`
        );
        throw new Error(
          `Price data object was null for chainId ${priceInfo.chainId}`
        );
      }

      // This chunk of code will be useful if the process ever updates more than just prices.
      // const chainConfigUpdate = {
      //   chainId: priceInfo.chainId,
      //   updateAssetConversionBuffer: false, //not supported by this process
      //   updateDeliverGasOverhead: false, //not supported by this process
      //   updatePrice: true,
      //   updateMaximumBudget: false, //not supported by this process
      //   updateTargetChainAddress: false, //not supported by this process
      //   updateSupportedChain: false, //not supported by this process
      //   isSupported: false, //ignored
      //   buffer: 0, //ignored
      //   bufferDenominator: 0, //ignored
      //   newWormholeFee: 0, //ignored?
      //   newGasOverhead: 0, //ignored
      //   gasPrice: priceInfo.updatePriceGas,
      //   nativeCurrencyPrice: priceInfo.updatePriceNative,
      //   targetChainAddress: null,
      //   maximumTotalBudget: null,
      // };
      // updates.push(chainConfigUpdate);

      const priceUpdate = {
        chainId: priceInfo.chainId,
        gasPrice: priceInfo.priceData.gasPrice,
        nativeCurrencyPrice: priceInfo.priceData.nativePrice,
      };
      transactionUpdateArray.push(priceUpdate);
    }

    const output = await contract.updatePrices(transactionUpdateArray);
    return output;
  }

  public reportPriceUpdate(
    chainName: string,
    params: { status: UpdateStatus }
  ) {
    this.exporter?.reportPriceUpdate(chainName, params.status);
  }

  public async reportPriceUpdateGas(chainName: string, gas: number) {
    this.exporter?.reportPriceUpdateGas(chainName, gas);
  }

  public reportContractPrice(
    chainName: string,
    price: number,
    params: { isGasPrice: boolean }
  ) {
    this.exporter?.reportContractPrice(
      chainName,
      params.isGasPrice ? "true" : "false",
      price
    );
  }

  public async getMetrics(): Promise<string> {
    return this.exporter?.metrics() ?? "";
  }

  //Utility function to get around big number issues
  public ethersMul(a: BigNumber, b: number): BigNumber {
    if (a == null || a.isZero() || b == null || b === 0) {
      return BigNumber.from(0);
    }

    const aFloat = parseFloat(ethers.utils.formatEther(a));

    const resultFloat = aFloat * b;

    return ethers.utils.parseEther(resultFloat.toFixed(18));
  }
}
