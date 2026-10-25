import type { HonoLogLayerVariables } from "@loglayer/hono";
import type { UserWithSchedule } from "../db/repositories/users";

export type AppEnv = { Variables: HonoLogLayerVariables };

export type UserEnv = { Variables: HonoLogLayerVariables & { user: UserWithSchedule } };
