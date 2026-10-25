import { DetailedError, hc, parseResponse, type ClientResponse } from "hono/client";
import { z } from "zod";
import { moodleToDeadlineEvents } from "@heresy/shared/moodle/deadlines";
import type { AppType } from "@heresy/server/api";
import type { User } from "grammy/types";
import { config } from "./config";

const errorBody = z.object({ message: z.string() });

/** The server's API, called on behalf of the Telegram user who sent the update. */
export function server(telegramId: number) {
  return hc<AppType>(config.api.url, {
    headers: { Authorization: `Bot ${config.api.secret}`, "X-Telegram-Id": String(telegramId) },
  }).api;
}

/** A rejected request. For 400s, `message` is the server's text for the user. */
export class ServerError extends Error {
  constructor(
    readonly status: number,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export async function read<Response extends ClientResponse<unknown>>(request: Promise<Response>) {
  try {
    return await parseResponse(request);
  } catch (cause) {
    if (!(cause instanceof DetailedError)) throw cause;

    const body = errorBody.safeParse(cause.detail?.data);

    throw new ServerError(
      Number(cause.statusCode),
      body.success ? body.data.message : cause.message,
      {
        cause,
      },
    );
  }
}

export function isUserFacing(error: unknown): error is ServerError {
  return error instanceof ServerError && error.status === 400;
}

export type Account = Awaited<ReturnType<typeof registerAccount>>;

/** The sender's account, or null before they connect anything. */
export async function findAccount(telegramId: number) {
  try {
    return await read(server(telegramId).account.$get());
  } catch (error) {
    if (error instanceof ServerError && error.status === 404) return null;

    throw error;
  }
}

/** Connecting Moodle or My DU is how users register, so those flows create the account. */
export function registerAccount(from: User) {
  return read(server(from.id).bot.users.$put({ json: from }));
}

export function updateAccount(telegramId: number, settings: AccountSettings) {
  return read(server(telegramId).account.$patch({ json: settings }));
}

type AccountSettings = Parameters<ReturnType<typeof server>["account"]["$patch"]>[0]["json"];

export async function fetchSchedule(telegramId: number) {
  const { events } = await read(server(telegramId)["my-du"].$get());

  return events;
}

/** Fails when Moodle cannot be reached; an unconnected account has no deadlines. */
export async function fetchDeadlines(telegramId: number) {
  const { events } = await read(server(telegramId).moodle.$get());

  return moodleToDeadlineEvents(events);
}
