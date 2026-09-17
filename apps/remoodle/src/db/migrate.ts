import { migrate } from "drizzle-orm/libsql/migrator";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { logger } from "../library/logger";
import { db } from "./index";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

const log = logger.child({ module: "db", operation: "migrate" });

log.info("running migrations");

const run = async () => {
  await migrate(db, { migrationsFolder });
  log.info("migrations complete");
  process.exit(0);
};

run().catch((error) => {
  log.error(
    { err: error instanceof Error ? error : new Error(String(error)) },
    "migrations failed",
  );
  process.exit(1);
});
