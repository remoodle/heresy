import type { HonoLogLayerVariables } from "@loglayer/hono";
import type { ExtraEnv } from "../env-extra";

export type Bindings = ExtraEnv & Env;

export type AppEnv = { Bindings: Bindings; Variables: HonoLogLayerVariables };
