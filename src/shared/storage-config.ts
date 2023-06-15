import { StorageConfiguration } from "@xlabs-xyz/relayer-status-api";

// TODO: eventually we'll need to find a way to get the env in only one file (opposed to reading env here and in relayer/env.ts)

export const relayStoreConfiguration: StorageConfiguration = {
  storageType: 'mongodb',
  databaseName: 'generic-relayer',
  abortOnConnectionError: true,
  connectionUrl: process.env.API_STORAGE_CONNECTION_URL || 'mongodb://localhost:27017',
  // datasourceOptions: {},
}

export const relayerStatusApiConfiguration = {
  port: process.env.API_PORT ? +process.env.API_PORT :  4200,
  prefix: '/relay-status',
}  