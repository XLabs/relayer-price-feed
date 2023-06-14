import { ChainId } from "@certusone/wormhole-sdk";
import * as fs from "fs";

export type GlobalConfig = {
  rpcs: Map<ChainId, string>;
  privateKeys: Map<ChainId, string>;
};

export function loadPrivateKeys(){
  const privateKeys = new Map<ChainId, string>([]);
  const rawValue = process.env.PRIVATE_KEYS;
  if (!rawValue) {
    throw new Error("PRIVATE_KEYS env var not set");
  }

  const parsed = JSON.parse(rawValue);
  for (const chainId of Object.keys(parsed)) {
    privateKeys.set(parseInt(chainId) as ChainId, parsed[chainId]);
  }

  return privateKeys;
}

export function loadGlobalConfig(path : string) : GlobalConfig {
  const file = fs.readFileSync(path, 'utf-8');
  const config = JSON.parse(file);
  const privateKeys = loadPrivateKeys();

  if(!config.rpcs) {
    throw new Error("Invalid config file provided to FixedPriceFetcher");
  }

  const rpcs = new Map<ChainId, string>();
  for (const chainId of Object.keys(config.rpcs)) {
    rpcs.set(parseInt(chainId) as ChainId, config.rpcs[chainId]);
  }

  return {
    rpcs,
    privateKeys,
  };

}