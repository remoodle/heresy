import { Gauge, Registry } from "prom-client";
import { db } from "../../../library/db";

const registry = new Registry();

const userGauge = new Gauge({
  name: "user_counter",
  help: "Number of users",
  registers: [registry],
});

async function initUserCounter() {
  const userCount = await db.user.countDocuments();
  userGauge.set(userCount);
}

export async function increaseUserCounter() {
  userGauge.inc();
}

export async function decreaseUserCounter() {
  userGauge.dec();
}

export async function initMetrics() {
  await initUserCounter();
}

export { registry };
