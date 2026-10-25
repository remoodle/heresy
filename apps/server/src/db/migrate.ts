import { migrate } from "drizzle-orm/libsql/migrator";
import { logger } from "../library/logger";
import { db } from "./index";

const log = logger.child().withContext({ module: "db", operation: "migrate" });

export async function runMigrations(migrationsFolder: string) {
  log.info("running migrations");
  await migrate(db, { migrationsFolder });
  log.info("migrations complete");
}
