import { Contract } from "ethers";
import { PriceUpdate, ContractUpdate } from "../types";

export type GenericRelayerPriceUpdate = PriceUpdate & {};

export type GenericRelayerContractUpdate = ContractUpdate & {};
