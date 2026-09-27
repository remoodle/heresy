import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { createDb } from "../../db";
import { remoodleConnectTokens, user } from "../../db/schema";
import type { AppEnv } from "../../context";
import { requireInternalToken, requireSession } from "../middleware/auth";
import { jsonBody } from "../validator";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));

  return "RE_" + Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export const userRemoodleToken = new Hono<AppEnv>().use(requireSession).post("/", async (c) => {
  const db = createDb(c.env.DB);
  const token = createToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60_000);
  await db.batch([
    db.delete(remoodleConnectTokens).where(eq(remoodleConnectTokens.userId, c.var.user.id)),
    db.insert(remoodleConnectTokens).values({
      id: crypto.randomUUID(),
      userId: c.var.user.id,
      token,
      expiresAt,
      createdAt: now,
    }),
  ]);
  c.var.logger.withContext({ remoodleConnect: { expiresAt: expiresAt.toISOString() } });
  const result = { token, expiresAt: expiresAt.toISOString() };

  return c.json(result);
});

export const internalRemoodle = new Hono<AppEnv>()
  .use(requireInternalToken)
  .post(
    "/connect",
    jsonBody(z.object({ token: z.string().trim().min(1).max(32) }), "Invalid connection token"),
    async (c) => {
      const db = createDb(c.env.DB);

      const [tokenRow] = await db
        .delete(remoodleConnectTokens)
        .where(eq(remoodleConnectTokens.token, c.req.valid("json").token))
        .returning();

      if (!tokenRow || tokenRow.expiresAt < new Date()) {
        throw new HTTPException(404, { message: "Token not found or expired" });
      }

      const [account] = await db
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(eq(user.id, tokenRow.userId))
        .limit(1);

      if (!account) throw new HTTPException(404, { message: "User not found" });
      c.var.logger.withContext({ remoodleConnect: { userId: account.id } });
      const result = { userId: account.id, email: account.email };

      return c.json(result);
    },
  );
