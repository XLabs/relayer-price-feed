import { ChainId } from "@certusone/wormhole-sdk";
import {
  UpdateStrategy, GlobalConfig,
  FixedPriceFetcherConfig,
  FixedPriceFetcher,
  executePriceFetching,
  executeStrategies,
  GenericRelayerStrategy,
  GenericRelayerStrategyConfig
} from "../src";
import { Logger, createLogger, format, transports } from "winston";

//Start! Set up the global configuration object

//TODO read env
//const globalConfig : GlobalConfig = process.env.ENV === "tilt" ? require("./config/tilt.json") : {};

const globalConfig : GlobalConfig = {
  rpcs: new Map<ChainId, string>([
    [2,  "http://localhost:8545"],
    [4, "http://localhost:8546"],
  ]),
  privateKeys: new Map<ChainId, string>([
    //These are the owner keys of the contracts in tilt
    [2 , "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"],
    [4 , "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"]
  ])
}
const logger = createLogger({
  transports: [new transports.Console()],
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
});



//Next up, configure the price fetching process and run it!
const fixedPriceFetcherConfig : FixedPriceFetcherConfig = {
    nativeTokens: new Map<ChainId, number>(
      [
        [2, 5.0],
        [4, 5.0]
      ]
    ),
    runFrequencyMs: 1000
}
const priceFetchingProcess = new FixedPriceFetcher(fixedPriceFetcherConfig, globalConfig, logger);
executePriceFetching(priceFetchingProcess, logger);




//Finally, configure all the strategies and then run them!
const genericRelayerStrategyConfig : GenericRelayerStrategyConfig = {
  contractAddresses: new Map<ChainId, string>(
    [
      [2, "0x1ef9e15c3bbf0555860b5009B51722027134d53a"],
      [4, "0x1ef9e15c3bbf0555860b5009B51722027134d53a"]
    ])
} 
const genericRelayerStrategy = new GenericRelayerStrategy(genericRelayerStrategyConfig, globalConfig, logger);

const allStrategies : UpdateStrategy[] = [];
allStrategies.push(genericRelayerStrategy);

executeStrategies(allStrategies, globalConfig, priceFetchingProcess.getPricingData(), logger);
