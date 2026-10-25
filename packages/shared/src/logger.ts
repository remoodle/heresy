import { PinoTransport } from "@loglayer/transport-pino";
import { LogLayer } from "loglayer";
import pino from "pino";

// Node-only: the browser bundle of the calendar must never import this module.
export function createLogger(service: string, environment: string) {
  return new LogLayer({
    transport: new PinoTransport({ logger: pino({ base: { service, environment } }) }),
  });
}
