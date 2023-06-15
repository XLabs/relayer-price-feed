import { ChainId } from "@certusone/wormhole-sdk";
import {
  UpdateStrategy,
  GlobalConfig,
  FixedPriceFetcherConfig,
  FixedPriceFetcher,
  executePriceFetching,
  executeStrategies,
  GenericRelayerStrategy,
  GenericRelayerStrategyConfig,
  loadPrivateKeys,
  loadGlobalConfig,
} from "../src";
import { Logger, createLogger, format, transports } from "winston";
import { BigNumber } from "ethers";
import { fromB64 } from "@mysten/sui.js";

//Start! Set up the global configuration object

//In testing, we load private keys into the environment via dotenv.
//If this differs in your environment, you can just remove this.
import * as dotenv from "dotenv";
dotenv.config({ path: "./example/.env.tilt"});

//const globalConfig : GlobalConfig = process.env.ENV === "tilt" ? require("./config/tilt.json") : {};

const tiltConfig: GlobalConfig = loadGlobalConfig("./example/config/globalConfig.json");
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

const globalConfig: GlobalConfig = tiltConfig;

//Next up, configure the price fetching process and run it!
const fixedPriceFetcherConfig: FixedPriceFetcherConfig = FixedPriceFetcher.loadConfig("./example/config/fixedPriceFetcherConfig.json");
const priceFetchingProcess = new FixedPriceFetcher(
  fixedPriceFetcherConfig,
  globalConfig,
  logger
);
executePriceFetching(priceFetchingProcess, logger);

//Finally, configure all the strategies and then run them!
const genericRelayerStrategyConfig: GenericRelayerStrategyConfig = GenericRelayerStrategy.loadConfig("./example/config/genericRelayerStrategyConfig.json");
const genericRelayerStrategy = new GenericRelayerStrategy(
  genericRelayerStrategyConfig,
  globalConfig,
  logger
);

const allStrategies: UpdateStrategy[] = [];
allStrategies.push(genericRelayerStrategy);

executeStrategies(
  allStrategies,
  globalConfig,
  priceFetchingProcess.getPricingData(),
  logger
);
