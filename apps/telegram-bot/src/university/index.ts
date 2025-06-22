import { config } from "../config";
import { aitu } from "./formatters/aitu";

export const universities = {
  aitu,
} as const;

export const uni = universities[config.uni];
