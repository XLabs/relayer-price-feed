import { startRelayDataApi, StorageConfiguration, ApiConfiguration } from "@xlabs-xyz/relayer-status-api";

import { relayStoreConfiguration } from './shared/storage-config';

import { getLogger } from './shared/logger';

const logger = getLogger();

(async function main() {
  const storeConfig: StorageConfiguration = {
    ...relayStoreConfiguration,
    logger: logger.child({ module: 'storage' }),
  }

  const apiConfig: ApiConfiguration = {
    port: 4200,
    prefix: '/relay-status-api',
    logger: logger.child({ module: 'api' }),
  };

  startRelayDataApi(storeConfig, apiConfig);
})();
