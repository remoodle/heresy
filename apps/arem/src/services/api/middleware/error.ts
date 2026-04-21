import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "../../../config";

export class JSONHTTPException extends HTTPException {
  public payload?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    payload?: Record<string, unknown>,
  ) {
    // @ts-expect-error: can't import ContentfulStatusCode from hono
    super(status, { message });

    this.payload = payload;
    this.name = "JSONHTTPException";
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  const status = err instanceof HTTPException ? err.status : 500;

  const base = {
    error: {
      status,
      message:
        err instanceof HTTPException ? err.message : "Internal Server Error",
    },
  };

  const extra =
    err instanceof JSONHTTPException && err.payload
      ? { extra: err.payload }
      : undefined;

  return c.json(
    {
      ...base,
      ...(extra ?? {}),
      ...(env.isDevelopment && { stack: err.stack }),
    },
    status,
  );
};
