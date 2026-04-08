import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramId: integer("telegram_id").notNull().unique(),
  calendarUrl: text("calendar_url").notNull(),
  thresholds: text("thresholds", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(["P1D", "PT3H"]),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const calendarEvents = sqliteTable(
  "calendar_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    eventId: text("event_id").notNull(),
    summary: text("summary").notNull(),
    timestampMs: integer("timestamp_ms").notNull(),
    categories: text("categories"),
    description: text("description"),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [unique().on(table.userId, table.eventId)],
);

export const sentReminders = sqliteTable(
  "sent_reminders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    eventId: text("event_id").notNull(),
    triggeredAt: integer("triggered_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [unique().on(table.userId, table.eventId, table.triggeredAt)],
);
