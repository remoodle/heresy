import type { Hono } from "hono";
import { prometheus } from "@hono/prometheus";
import { registry, initMetrics } from "../helpers/metrics";

const { registerMetrics, printMetrics } = prometheus({ registry });

export const applyPrometheus = (app: Hono): void => {
  initMetrics();

  app.use("*", registerMetrics);
  app.get("/metrics", printMetrics);
};
