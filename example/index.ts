import {
  UpdateStrategy,
  GlobalConfig,
  FixedPriceFetcherConfig,
  FixedPriceFetcher,
  executePriceFetching,
  executeStrategies,
  GenericRelayerStrategy,
  GenericRelayerStrategyConfig,
  loadGlobalConfig,
  PrometheusExporter,
} from "../src";
import { createLogger, format, transports } from "winston";
import Koa from "koa";
import Router from "koa-router";

//Start! Set up the global configuration object

//In testing, we load private keys into the environment via dotenv.
//If this differs in your environment, you can just remove this.
import * as dotenv from "dotenv";
dotenv.config({ path: "./example/.env.tilt" });

//const globalConfig : GlobalConfig = process.env.ENV === "tilt" ? require("./config/tilt.json") : {};

const tiltConfig: GlobalConfig = loadGlobalConfig(
  "./example/config/globalConfig.json"
);
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

// Metrics
const metricsExporter = new PrometheusExporter();

const globalConfig: GlobalConfig = tiltConfig;

//Next up, configure the price fetching process and run it!
const fixedPriceFetcherConfig: FixedPriceFetcherConfig =
  FixedPriceFetcher.loadConfig("./example/config/fixedPriceFetcherConfig.json");
const priceFetchingProcess = new FixedPriceFetcher(
  fixedPriceFetcherConfig,
  globalConfig,
  logger,
  metricsExporter
);
executePriceFetching(priceFetchingProcess, logger);

//Finally, configure all the strategies and then run them!
const genericRelayerStrategyConfig: GenericRelayerStrategyConfig =
  GenericRelayerStrategy.loadConfig(
    "./example/config/genericRelayerStrategyConfig.json"
  );
const genericRelayerStrategy = new GenericRelayerStrategy(
  genericRelayerStrategyConfig,
  globalConfig,
  logger,
  metricsExporter
);

const allStrategies: UpdateStrategy[] = [];
allStrategies.push(genericRelayerStrategy);

executeStrategies(
  allStrategies,
  globalConfig,
  priceFetchingProcess.getPricingData(),
  logger
);

// Start metrics webserver
const app = new Koa();
const router = new Router();

router.get("/metrics", async (ctx: Koa.Context) => {
  ctx.body = await priceFetchingProcess.getMetrics();
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
