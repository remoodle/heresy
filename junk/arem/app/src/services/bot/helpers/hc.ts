import type { AppType } from "../../api";
import { createHC } from "../../../library/utils/hc-wrapper";

import { config } from "../../../config";

const { request, requestUnwrap } = createHC<AppType>(config.http.url);

const getAuthHeaders = (telegramId: number) => {
  return {
    Authorization: `Telegram ${config.http.secret}::${telegramId}`,
  };
};

export { request, requestUnwrap, getAuthHeaders };
