import { cleanEnv, num, str } from "envalid";
import "dotenv/config";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
  }),
  // The worker sends notifications through the bot without running it.
  TELEGRAM_BOT_TOKEN: str(),
  TELEGRAM_BOT_USERNAME: str({ default: "feathermoodbot" }),
  // Shared with the Telegram bot, which calls the API on behalf of any Telegram user.
  BOT_API_SECRET: str(),
  HATCHET_CLIENT_TOKEN: str({ default: "" }),
  DATABASE_URL: str({ default: "./remoodle.db" }),
  API_PORT: num({ default: 3000 }),
  // Public origin of the API, used in iCal subscription links.
  API_URL: str({ default: "http://localhost:3000" }),
  // Encrypts stored My DU tokens. Changing it disconnects every My DU connection.
  ENCRYPTION_KEY: str(),
});

export const config = {
  telegram: {
    token: env.TELEGRAM_BOT_TOKEN,
    url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}`,
  },
  hatchet: {
    token: env.HATCHET_CLIENT_TOKEN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  api: {
    port: env.API_PORT,
    url: env.API_URL,
    botSecret: env.BOT_API_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
  },
};
