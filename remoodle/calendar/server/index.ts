import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ScheduleData } from "./types.d";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

const FILE_NAME = "main.json";

const route = app.get("/api/groups", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);

  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const scheduleData: ScheduleData = await schedule.json();
  return c.json(Object.keys(scheduleData.lessonsByGroupname));
}).get("/api/locations", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);

  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const scheduleData: ScheduleData = await schedule.json();
  return c.json(Object.keys(scheduleData.lessonsByLocation));
}).get("/api/teachers", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);

  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const scheduleData: ScheduleData = await schedule.json();
  return c.json(Object.keys(scheduleData.lessonsByTeacher));
}).get("/api/groups/:group", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);
  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const group = c.req.param("group");
  const scheduleData: ScheduleData = await schedule.json();

  return c.json(scheduleData.lessonsByGroupname[group]);
}).get("/api/locations/:location", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);
  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const location = c.req.param("location");
  const scheduleData: ScheduleData = await schedule.json();

  return c.json(scheduleData.lessonsByLocation[location]);
}).get("/api/teachers/:teacher", async (c) => {
  const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);
  if (!schedule) {
    return c.json({ error: "Schedule not found" }, 500);
  }

  const teacher = c.req.param("teacher");
  const scheduleData: ScheduleData = await schedule.json();

  return c.json(scheduleData.lessonsByTeacher[teacher]);
}).put("/api/schedule", async (c) => {
  const body = await c.req.text();

  await c.env.SCHEDULE_BUCKET.put(FILE_NAME, body, {
    httpMetadata: { contentType: "application/json" },
  });

  return c.json({ ok: true });
});

export type AppType = typeof route;

export default app;
