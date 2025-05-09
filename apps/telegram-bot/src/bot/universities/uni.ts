import { config } from "../../config";
import { Aitu } from "./aitu";
import { Nu } from "./nu";

const universities = {
  aitu: new Aitu(),
  nu: new Nu(),
};

const uni = universities[config.uni];

export default uni;
