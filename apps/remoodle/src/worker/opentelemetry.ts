import { createRequire } from "node:module";
import { HatchetInstrumentor } from "@hatchet-dev/typescript-sdk/opentelemetry";

const require = createRequire(import.meta.url);
const { registerInstrumentations } = require("@opentelemetry/instrumentation") as {
  registerInstrumentations: (options: { instrumentations: unknown[] }) => void;
};

const globalState = globalThis as typeof globalThis & {
  __remoodleHatchetOtelInitialized?: boolean;
};

export function initializeOpenTelemetry() {
  if (globalState.__remoodleHatchetOtelInitialized) {
    return;
  }

  registerInstrumentations({
    instrumentations: [
      new HatchetInstrumentor({
        includeTaskNameInSpanName: true,
      }),
    ],
  });

  globalState.__remoodleHatchetOtelInitialized = true;
}

initializeOpenTelemetry();
