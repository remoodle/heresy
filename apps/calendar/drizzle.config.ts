import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { D1Helper } from "@nerdfolio/drizzle-d1-helpers";

dotenv.config({ path: "./.dev.vars" });

const crawledDbHelper = D1Helper.get("DB");

const isProd = () => process.env.NODE_ENV === 'production'

const getCredentials = () => {
  const prod = {
    driver: 'd1-http',
    dbCredentials: {
      ...crawledDbHelper.withCfCredentials(
        process.env.CLOUDFLARE_ACCOUNT_ID,
        process.env.CLOUDFLARE_D1_TOKEN,
      ).proxyCredentials,
    }
  }

  const dev = {
    dbCredentials: {
      url: crawledDbHelper.sqliteLocalFileCredentials.url
    }
  }

  // return prod;
  return isProd() ? prod : dev
}

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "sqlite",
  ...getCredentials()
});