import type { Context, MiddlewareHandler } from "hono";

import { config } from "./config.js";
import { HttpError } from "./errors.js";

export interface AuthClient {
  id: string;
}

type AuthVariables = {
  client: AuthClient;
};

export type AppEnv = {
  Variables: AuthVariables;
};

function getBearerToken(c: Context) {
  const header = c.req.header("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim();
}

export const requireGatewayToken: MiddlewareHandler<AppEnv> = async (c, next) => {
  const bearerToken = getBearerToken(c);
  if (!bearerToken) {
    throw new HttpError(401, "Missing bearer token.", "missing_token");
  }
  if (bearerToken !== config.gatewayToken) {
    throw new HttpError(401, "Invalid bearer token.", "invalid_token");
  }

  c.set("client", { id: "townino" });
  await next();
};
