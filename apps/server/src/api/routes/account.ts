import { Hono } from "hono";
import { database } from "../../db";
import { accountSettingsSchema, toAccount, updateSettings } from "../../library/account";
import type { UserEnv } from "../context";
import { privateResponse, requireUser } from "../middleware/auth";
import { jsonBody } from "../validator";

export const account = new Hono<UserEnv>()
  .use(privateResponse, requireUser)
  .get("/", (c) => c.json(toAccount(c.var.user), 200))
  .patch("/", jsonBody(accountSettingsSchema, "Check your settings."), async (c) =>
    c.json(await updateSettings(c.var.user, c.req.valid("json")), 200),
  )
  // Sessions, connections, cached events, and reminder history cascade with the user.
  .delete("/", async (c) => {
    await database.users.remove(c.var.user.id);

    return c.json({ ok: true }, 200);
  });
