import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { config } from "../config";

export const hatchet = HatchetClient.init({
  token: config.hatchet.token,
});
