import { ChainId } from "@certusone/wormhole-sdk";

export type GlobalConfig = {
  rpcs: Map<ChainId, string>;
  privateKeys: Map<ChainId, string>;
};
