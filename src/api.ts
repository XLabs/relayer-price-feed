import { startRelayDataApi, StorageConfiguration, ApiConfiguration } from "@xlabs-xyz/relayer-status-api";

import { relayStoreConfiguration } from './shared/storage-config';

import { getLogger } from './shared/logger';

const relayerStatusApiConfiguration = {
  port: process.env.API_PORT ? +process.env.API_PORT :  4200,
  prefix: '/relay-status',
};

const logLevel = process.env.LOG_LEVEL;

const logger = getLogger(logLevel);

(async function main() {
  const storeConfig: StorageConfiguration = {
    ...relayStoreConfiguration,
    logger: logger.child({ module: 'storage' }),
  }

  const apiConfig: ApiConfiguration = {
    ...relayerStatusApiConfiguration,
    logger: logger.child({ module: 'api' }),
  };

  startRelayDataApi(storeConfig, apiConfig);
})();
