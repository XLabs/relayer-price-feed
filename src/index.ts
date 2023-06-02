// A typical oracle implementation should grab a config
// extract the price fetcher, the strategy, and a contract
// updater.
// And then run in a loop, hitting the price fechter to
// look for prices for tokens passed in the configuration.
// Run the strategy for the prices and the strategy will
// decide whether to update the price using the ContractUpdater.
export * from "./config";
export * from "./oracle";
export * from "./prices/fetcher";
export * from "./contract";
export { EvmContract, EvmWallet } from "./contract/evm";
