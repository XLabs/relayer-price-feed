import { StorageConfiguration } from "@xlabs-xyz/relayer-status-api";

export const relayStoreConfiguration: StorageConfiguration = {
  storageType: 'mongodb',
  databaseName: 'wormhole-relays',
  abortOnConnectionError: true,
  connectionUrl: process.env.API_STORAGE_CONNECTION_URL || 'mongodb://localhost:27017',
  // datasourceOptions: {},
}