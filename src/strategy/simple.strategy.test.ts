import { describe, expect, test } from "@jest/globals";

import { SimpleUpdateStrategy } from ".";
import { BasicContractUpdater } from "../contract"; // path from tsc config breaks here

describe("Simple Update Strategy tests", () => {
  test("Push new prices without executor should fail", async () => {
    const strategy = new SimpleUpdateStrategy();
    await expect(() =>
      strategy.pushNewPrices(new Map<string, BigInt>([["WBTC", 1n]]))
    ).rejects.toThrow(Error);
  });

  test("Push new prices with an executor set does ok", async () => {
    const strategy = new SimpleUpdateStrategy();
    const updater = new BasicContractUpdater();

    strategy.setExecutor(updater);
    strategy.pushNewPrices(new Map<string, BigInt>([["WBTC", 1n]]));
  });
});
