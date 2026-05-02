import { defineConfig } from "drizzle-kit";
import { D1Helper } from "@nerdfolio/drizzle-d1-helpers";
import dotenv from "dotenv";

dotenv.config({ path: "./.dev.vars" });

const isRemote = process.env.DRIZZLE_ENV === "remote";
const dbHelper = D1Helper.get("DB");

const hasRemoteCredentials =
  !!process.env.CLOUDFLARE_ACCOUNT_ID &&
  !!process.env.CLOUDFLARE_D1_TOKEN &&
  !!(process.env.CLOUDFLARE_DATABASE_ID || process.env.DB);

const getLocalCredentials = () => {
  return {
    dbCredentials: {
      url: dbHelper.sqliteLocalFileCredentials.url,
    },
  };
};

const getRemoteCredentials = () => {
  if (!hasRemoteCredentials) {
    return {};
  }

  return {
    driver: "d1-http",
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? process.env.DB!,
      token: process.env.CLOUDFLARE_D1_TOKEN!,
    },
  };
};

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "sqlite",
  ...(isRemote ? getRemoteCredentials() : getLocalCredentials()),
});
