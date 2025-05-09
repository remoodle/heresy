import { config } from "../../config";
import { AITU } from "./aitu";

const universities = {
  aitu: new AITU(),
};

const uni = universities[config.uni];

export { uni };
