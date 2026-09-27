import app from "./app";
import type { Bindings } from "./context";
import { syncDueSchedules } from "./jobs/sync-schedules";

export type { AppType } from "./app";

export default {
  fetch: app.fetch,
  scheduled(_event: ScheduledController, env: Bindings, context: ExecutionContext) {
    return syncDueSchedules(env, context);
  },
};
