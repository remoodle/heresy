import { HatchetClient } from "@hatchet-dev/typescript-sdk/v1";
import { config } from "../config";

export const hatchet = HatchetClient.init({
  token: config.hatchet.token,
});
