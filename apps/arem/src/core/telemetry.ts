import { BullMQOtel } from "bullmq-otel";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { config } from "../config";

export const sdk = new NodeSDK({
  serviceName: config.otel.serviceName,
  traceExporter: new OTLPTraceExporter({
    url: config.otel.otlpEndpoint + "/v1/traces",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: config.otel.otlpEndpoint + "/v1/metrics",
    }),
  }),
});

export const bullOtel = new BullMQOtel("remoodle");
