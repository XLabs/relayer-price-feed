import { ContractUpdater } from "../contract";

export interface UpdateStrategy {
  setExecutor(contractUpdater: ContractUpdater): void;
  pushNewPrices(prices: Map<string, BigInt>): Promise<void>;
}

export class SimpleUpdateStrategy implements UpdateStrategy {
  updater: ContractUpdater | undefined;

  public setExecutor(contractUpdater: ContractUpdater): void {
    this.updater = contractUpdater;
  }

  public async pushNewPrices(price: Map<string, BigInt>): Promise<void> {
    if (!this.updater) {
      throw new Error(
        "A contract updater should be provided before pushing price updates."
      );
    }

    // @TODO: Add simple strategy checks and then update the price if necessary
    this.updater.executePriceUpdate(price);
  }
}
