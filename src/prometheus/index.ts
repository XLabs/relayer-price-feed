import { Counter, Gauge, MetricValue, Registry } from "prom-client";

function registerPricePollingCounter(registry: Registry) {
  return new Counter({
    name: "price_polling_total",
    help: "Number of times we polled a price provider",
    labelNames: ["status"],
    registers: [registry],
  });
}

function registerPriceUpdatesCounter(registry: Registry) {
  return new Counter({
    name: "price_updates_total",
    help: "Number of times a contract call has attempted to update prices",
    labelNames: ["chain_id", "status"],
    registers: [registry],
  });
}

function registerPriceUpdateGas(registry: Registry) {
  return new Gauge({
    name: "price_update_gas_cost",
    help: "Total gas amount used to update contracts",
    labelNames: ["chain_name"],
    registers: [registry],
  });
}

function registerProviderPrices(registry: Registry) {
  return new Gauge({
    name: "price_provider_prices",
    help: "Prices from provider",
    labelNames: ["token"],
    registers: [registry],
  });
}

function registerContractPrices(registry: Registry) {
  return new Gauge({
    name: "price_contract_prices",
    help: "Prices from contracts",
    labelNames: ["chain_name", "is_gas_price"],
    registers: [registry],
  });
}

export class PrometheusExporter {
  private pricePollingCounter: Counter;
  private priceUpdatesCounter: Counter;
  private priceUpdateGas: Gauge;
  private providerPrices: Gauge;
  private contractPrices: Gauge;

  private registry: Registry;

  constructor(registry?: Registry) {
    this.registry = registry || new Registry();

    this.pricePollingCounter = registerPricePollingCounter(this.registry);
    this.priceUpdatesCounter = registerPriceUpdatesCounter(this.registry);
    this.priceUpdateGas = registerPriceUpdateGas(this.registry);
    this.providerPrices = registerProviderPrices(this.registry);
    this.contractPrices = registerContractPrices(this.registry);
  }

  public metrics() {
    return this.registry.metrics();
  }

  public reportPricePolling(status: string) {
    this.pricePollingCounter.inc({ status });
  }

  public reportPriceUpdate(chainName: string, status: string) {
    this.priceUpdatesCounter.inc({ chain_name: chainName, status });
  }

  public async reportPriceUpdateGas(chainName: string, gas: number) {
    const allValues = await this.priceUpdateGas.get();
    const currentGas = allValues.values.reduce((acc, current) => {
      if (current.labels.chain_name === chainName) {
        return acc + current.value;
      }

      return acc;
    }, 0);

    this.priceUpdateGas.set({ chain_name: chainName }, currentGas + gas);
  }

  public reportProviderPrice(token: string, price: number) {
    this.providerPrices.set({ token }, price);
  }

  public reportContractPrice(
    chainName: string,
    isGasPrice: string,
    price: number
  ) {
    this.contractPrices.set(
      { chain_name: chainName, is_gas_price: isGasPrice },
      price
    );
  }
}
