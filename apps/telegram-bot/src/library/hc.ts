import type { AppType } from "@remoodle/backend/api";
import { createHC } from "@remoodle/utils";

import { config } from "../config";

const { request, requestUnwrap } = createHC<AppType>(config.backend.url);

const getAuthHeaders = (telegramId: number) => {
  return {
    Authorization: `Telegram ${config.backend.secret}::${telegramId}`,
  };
};

export { request, requestUnwrap, getAuthHeaders };
