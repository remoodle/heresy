import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { filterSchedule } from "../../../shared/schedule";
import { createDb } from "../../db";
import { icalTokens } from "../../db/schema";
import { generateIcal } from "../../lib/ical";
import { readSchedule } from "../../lib/my-du/service";
import type { AppEnv } from "../../context";
import { requireSession } from "../middleware/auth";
import { jsonBody } from "../validator";

const filtersSchema = z.object({
  classes: z.boolean().optional(),
  courses: z.record(
    z.string(),
    z.object({
      enabled: z.boolean(),
      lecture: z.boolean(),
      practice: z.boolean(),
      online: z.boolean(),
      offline: z.boolean(),
    }),
  ),
  ical: z
    .object({
      combineAdjacentPairs: z.boolean().optional(),
      startDate: z.iso.date().optional(),
      endDate: z.iso.date().optional(),
    })
    .optional(),
});

const filtersBody = jsonBody(z.object({ filters: filtersSchema }), "Invalid calendar filters");

// Public feed for calendar apps; the unguessable token is the only credential.
export const icalFeed = new Hono<AppEnv>().get("/:token", async (c) => {
  c.var.logger.withContext({ ical: { tokenProvided: true } });
  const db = createDb(c.env.DB);

  const [tokenRow] = await db
    .select()
    .from(icalTokens)
    .where(eq(icalTokens.token, c.req.param("token")))
    .limit(1);

  if (!tokenRow) throw new HTTPException(404, { message: "Token not found" });
  const filters = filtersSchema.parse(tokenRow.filters);
  const schedule = await readSchedule(c.env, tokenRow.userId);

  const ical = generateIcal(filterSchedule(schedule.events, filters), {
    combineAdjacentPairs: filters.ical?.combineAdjacentPairs,
    rangeStart: filters.ical?.startDate,
    rangeEnd: filters.ical?.endDate,
  });

  return c.body(ical, 200, {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'inline; filename="calendar.ics"',
  });
});

export const userIcalToken = new Hono<AppEnv>()
  .use(requireSession)
  .get("/", async (c) => {
    const [row] = await createDb(c.env.DB)
      .select()
      .from(icalTokens)
      .where(eq(icalTokens.userId, c.var.user.id))
      .limit(1);

    const subscription = row
      ? {
          token: row.token,
          url: `${c.env.BETTER_AUTH_URL}/api/ical/${row.token}`,
          filters: row.filters ?? null,
        }
      : null;

    return c.json(subscription);
  })
  .post("/", filtersBody, async (c) => {
    const { filters } = c.req.valid("json");
    const token = crypto.randomUUID();
    const db = createDb(c.env.DB);
    await db
      .insert(icalTokens)
      .values({
        id: crypto.randomUUID(),
        userId: c.var.user.id,
        token,
        filters,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: icalTokens.userId,
        set: { token, filters, createdAt: new Date() },
      });
    c.var.logger.withContext({ ical: { hasFilters: true } });
    const subscription = { token, url: `${c.env.BETTER_AUTH_URL}/api/ical/${token}` };

    return c.json(subscription);
  })
  .patch("/", filtersBody, async (c) => {
    const { filters } = c.req.valid("json");

    const changed = await createDb(c.env.DB)
      .update(icalTokens)
      .set({ filters })
      .where(eq(icalTokens.userId, c.var.user.id))
      .returning({ id: icalTokens.id });

    if (!changed.length) throw new HTTPException(404, { message: "Token not found" });
    c.var.logger.withContext({ ical: { hasFilters: true } });

    return c.json({ ok: true });
  });
