import { fileURLToPath } from "node:url";
import { runMigrations } from "./db/migrate";
import { logger } from "./library/logger";

// One build runs every server process; the first argument picks which. Each process migrates
// first, so whichever starts first brings the database up to date.
const service = process.argv[2];

if (service !== "api" && service !== "worker") {
  logger.withMetadata({ argument: service }).error("usage: bin <api|worker>");
  process.exit(1);
}

// The entry stays at the root of `dist`, and the build copies migrations next to it.
const migrationsFolder = fileURLToPath(new URL("./db/migrations", import.meta.url));

try {
  await runMigrations(migrationsFolder);
} catch (error) {
  logger
    .withError(error instanceof Error ? error : new Error(String(error)))
    .error("migrations failed");
  process.exit(1);
}

await (service === "api" ? import("./api/index") : import("./worker/index"));
