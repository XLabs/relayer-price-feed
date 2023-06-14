import { StorageConfiguration } from "@xlabs-xyz/relayer-status-api";

export const relayStoreConfiguration: StorageConfiguration = {
  storageType: 'mongodb',
  databaseName: 'generic-relayer',
  abortOnConnectionError: true,
  // TODO: eventually we'll need to find a way to get the env in only one file (opposed to reading env here and in relayer/env.ts)
  connectionUrl: process.env.API_STORAGE_CONNECTION_URL || 'mongodb://localhost:27017',
  // datasourceOptions: {},
}