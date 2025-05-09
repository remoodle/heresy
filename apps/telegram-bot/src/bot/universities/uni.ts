import { config } from "../../config";
import { Aitu } from "./aitu";

const universities = {
  aitu: new Aitu(),
};

const uni = universities[config.uni];

export default uni;
