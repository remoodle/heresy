import { cleanEnv, str } from "envalid";
import "dotenv/config";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
  }),

  LOG_LEVEL: str({
    choices: ["trace", "debug", "info", "warn", "error", "fatal", "silent"],
    default: "info",
  }),

  VERSION_TAG: str({ default: "~" }),

  TELEGRAM_BOT_TOKEN: str(),

  BACKEND_URL: str({ default: "http://localhost:9000" }),
  BACKEND_SECRET: str({ default: "mKskw" }),

  FRONTEND_URL: str({ default: "https://remoodle.app" }),

  REDIS_URI: str({ default: "redis://localhost:6379" }),

  UNI: str({
    default: "aitu",
    choices: ["aitu"],
  }),
});

export const config = {
  version: env.VERSION_TAG,
  logLevel: env.LOG_LEVEL,
  backend: {
    url: env.BACKEND_URL,
    secret: env.BACKEND_SECRET,
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  bot: {
    token: env.TELEGRAM_BOT_TOKEN,
  },
  redis: {
    uri: env.REDIS_URI,
  },
  uni: env.UNI,
};
