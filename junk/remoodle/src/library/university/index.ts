import { config } from "../../config";
import { aitu } from "./aitu";

export const adapters = {
  aitu,
} as const;

export const uni = adapters[config.uni];
