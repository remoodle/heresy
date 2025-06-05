import { config } from "../../config";
import { AITU } from "./aitu";
import { NU } from "./nu";

const universities = {
  aitu: new AITU(),
  nu: new NU(),
};

const uni = universities[config.uni];

export { uni };
