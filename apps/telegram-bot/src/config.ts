import { cleanEnv, str } from "envalid";
import "dotenv/config";

const AITUMAP_URL = "https://aitumap.remoodle.app";

const DOCS_URL = "https://docs.remoodle.app";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
  }),
  TELEGRAM_BOT_TOKEN: str(),
  // The server owns every account and connection; the bot only talks to its API.
  API_URL: str({ default: "http://localhost:3000" }),
  BOT_API_SECRET: str(),
  // Public origin of the web calendar, linked from the menu.
  CALENDAR_URL: str({ default: "http://localhost:5173" }),
  CABGEN_CDN_URL: str({ default: "https://cabgen.remoodle.app" }),
});

export const config = {
  telegram: {
    token: env.TELEGRAM_BOT_TOKEN,
  },
  api: {
    url: env.API_URL,
    secret: env.BOT_API_SECRET,
  },
  calendar: {
    url: env.CALENDAR_URL,
    host: new URL(env.CALENDAR_URL).host,
  },
  aitumap: {
    url: AITUMAP_URL,
  },
  docs: {
    url: DOCS_URL,
  },
  roomsCdnUrl: env.CABGEN_CDN_URL,
};
