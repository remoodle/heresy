import { cleanEnv, str } from "envalid";
import "dotenv/config";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
  }),
  TELEGRAM_BOT_TOKEN: str(),
  HATCHET_CLIENT_TOKEN: str({ default: "" }),
  DATABASE_URL: str({ default: "./remoodle.db" }),
});

export const config = {
  telegram: {
    token: env.TELEGRAM_BOT_TOKEN,
  },
  hatchet: {
    token: env.HATCHET_CLIENT_TOKEN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  reminders: {
    defaultThresholds: ["P1D", "PT3H"],
    maxThresholds: 10,
  },
};
