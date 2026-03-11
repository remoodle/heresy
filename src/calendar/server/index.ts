import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { ScheduleData, ScheduleFilter } from "./types.d";
import { createAuth } from "./auth";
import { createDb } from "./db";
import { icalTokens } from "./db/schema";
import { generateIcal } from "./ical";

const app = new Hono<{
  Bindings: Env;
}>();

app.use("*", cors());

const FILE_NAME = "main.json";

async function getSession(env: Env, headers: Headers) {
  const auth = createAuth(env);
  return auth.api.getSession({ headers });
}

function applyFilters(items: ScheduleData[string], f: ScheduleFilter) {
  return items.filter((item) => {
    if (f.excludedCourses.includes(item.courseName)) return false;

    const isLearn = item.teacher.startsWith("https://learn");
    if (isLearn && !f.eventTypes.learn) return false;
    if (!isLearn && item.type === "lecture" && !f.eventTypes.lecture)
      return false;
    if (!isLearn && item.type === "practice" && !f.eventTypes.practice)
      return false;

    if (item.isOnline && !f.eventFormats.online) return false;
    if (!item.isOnline && !f.eventFormats.offline) return false;

    return true;
  });
}

const route = app
  .get("/api/groups", async (c) => {
    const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);
    const group = c.req.query("group");

    if (!schedule) {
      throw new HTTPException(404, { message: "Schedule not found" });
    }

    const scheduleData: ScheduleData = await schedule.json();

    if (group) {
      return c.json(scheduleData[group] ?? []);
    }

    return c.json(Object.keys(scheduleData));
  })
  .put("/api/schedule", async (c) => {
    const body = await c.req.text();

    await c.env.SCHEDULE_BUCKET.put(FILE_NAME, body, {
      httpMetadata: { contentType: "application/json" },
    });

    return c.json({ ok: true });
  })
  .all("/api/auth/**", async (c) => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw);
  })
  .get("/api/ical/:token", async (c) => {
    const tokenParam = c.req.param("token");
    const db = createDb(c.env.DB);

    const [tokenRow] = await db
      .select()
      .from(icalTokens)
      .where(eq(icalTokens.token, tokenParam))
      .limit(1);

    if (!tokenRow) {
      throw new HTTPException(404, { message: "Token not found" });
    }

    const schedule = await c.env.SCHEDULE_BUCKET.get(FILE_NAME);
    if (!schedule) {
      throw new HTTPException(404, { message: "Schedule not found" });
    }

    const scheduleData: ScheduleData = await schedule.json();
    let items = scheduleData[tokenRow.group] ?? [];

    if (tokenRow.filters) {
      items = applyFilters(items, tokenRow.filters as ScheduleFilter);
    }

    const ical = generateIcal(items, new Date());

    return new Response(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="calendar.ics"',
      },
    });
  })
  .get("/api/user/ical-token", async (c) => {
    const session = await getSession(c.env, c.req.raw.headers);
    if (!session) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const group = c.req.query("group");
    if (!group) {
      throw new HTTPException(400, { message: "group is required" });
    }

    const db = createDb(c.env.DB);
    const [tokenRow] = await db
      .select()
      .from(icalTokens)
      .where(
        and(
          eq(icalTokens.userId, session.user.id),
          eq(icalTokens.group, group),
        ),
      )
      .limit(1);

    if (!tokenRow) {
      return c.json(null);
    }

    const url = `${c.env.BETTER_AUTH_URL}/api/ical/${tokenRow.token}`;
    return c.json({ token: tokenRow.token, group: tokenRow.group, url });
  })
  .post("/api/user/ical-token", async (c) => {
    const session = await getSession(c.env, c.req.raw.headers);
    if (!session) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const body = await c.req.json<{ group: string; filters: ScheduleFilter }>();
    if (!body.group) {
      throw new HTTPException(400, { message: "group is required" });
    }

    const db = createDb(c.env.DB);

    const [existing] = await db
      .select()
      .from(icalTokens)
      .where(
        and(
          eq(icalTokens.userId, session.user.id),
          eq(icalTokens.group, body.group),
        ),
      )
      .limit(1);

    const token = crypto.randomUUID();

    if (existing) {
      await db
        .update(icalTokens)
        .set({ token, filters: body.filters ?? null, createdAt: new Date() })
        .where(eq(icalTokens.id, existing.id));
    } else {
      await db.insert(icalTokens).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        token,
        group: body.group,
        filters: body.filters ?? null,
        createdAt: new Date(),
      });
    }

    const url = `${c.env.BETTER_AUTH_URL}/api/ical/${token}`;
    return c.json({ token, group: body.group, url });
  })
  .patch("/api/user/ical-token", async (c) => {
    const session = await getSession(c.env, c.req.raw.headers);
    if (!session) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const body = await c.req.json<{ group: string; filters: ScheduleFilter }>();
    if (!body.group) {
      throw new HTTPException(400, { message: "group is required" });
    }

    const db = createDb(c.env.DB);

    const [existing] = await db
      .select()
      .from(icalTokens)
      .where(
        and(
          eq(icalTokens.userId, session.user.id),
          eq(icalTokens.group, body.group),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new HTTPException(404, { message: "Token not found" });
    }

    await db
      .update(icalTokens)
      .set({ filters: body.filters ?? null })
      .where(eq(icalTokens.id, existing.id));

    return c.json({ ok: true });
  });

app.onError((error, ctx) => {
  const status = error instanceof HTTPException ? error.status : 500;
  console.error(error);
  return ctx.json(
    { status, message: error.message, stack: error.stack },
    status,
  );
});

export type AppType = typeof route;

export default app;
