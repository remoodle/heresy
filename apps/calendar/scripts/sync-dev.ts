import { hc } from "hono/client";
import { readFileSync } from "node:fs";
import type { AppType } from "../server/index.ts";

const client = hc<AppType>("http://localhost:5173");

const schedule = JSON.parse(readFileSync("./data/main.json", "utf-8"));

const res = await client.api.schedule.$put({ json: schedule });
const result = await res.json();

console.log(result);
