import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ScheduleData } from "./types.d";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

const FILE_NAME = "main.json";

const route = app.get("/api/groups", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);

  const group = c.req.query("group");

  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const scheduleData: ScheduleData = await schedule.json();

  if (group) {
    return c.json(scheduleData[group] ?? []);
  }

  return c.json(Object.keys(scheduleData));
}).put("/api/schedule", async (c) => {
  const body = await c.req.text();

  await c.env.SCHEDULE_BUCKET.put(FILE_NAME, body, {
    httpMetadata: { contentType: "application/json" },
  });

  return c.json({ ok: true });
});

export type AppType = typeof route;

export default app;
