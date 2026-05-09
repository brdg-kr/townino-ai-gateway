import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { type AppEnv, requireGatewayToken } from "./auth.js";
import { config } from "./config.js";
import { HttpError } from "./errors.js";
import {
  editMenuPhoto,
  type ImageEditor,
  parseMenuPhotoEditRequest,
} from "./image-edit.js";
import { getUsage, reserveRequest } from "./quota.js";

type CreateAppOptions = {
  imageEditor?: ImageEditor;
};

export function createApp(options: CreateAppOptions = {}) {
  const imageEditor = options.imageEditor ?? { editMenuPhoto };
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return "*";
        if (!config.allowedOrigins.length) return origin;
        return config.allowedOrigins.includes(origin) ? origin : "";
      },
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  );

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        error.status as never
      );
    }

    if (error instanceof HTTPException) {
      return c.json(
        {
          error: {
            code: "http_exception",
            message: error.message,
          },
        },
        error.status
      );
    }

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: {
            code: "invalid_request",
            message: "Request body is invalid.",
            issues: error.issues,
          },
        },
        400
      );
    }

    console.error(error);
    return c.json(
      {
        error: {
          code: "internal_error",
          message: "Internal server error.",
        },
      },
      500
    );
  });

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "townino-ai-gateway",
      environment: config.nodeEnv,
      model: config.imageModel,
      outputFormat: config.imageOutputFormat,
      quality: config.imageQuality,
      size: config.imageSize,
    })
  );

  app.get("/v1/me", requireGatewayToken, (c) => {
    const client = c.get("client");
    return c.json({
      client,
      usage: getUsage(client.id),
    });
  });

  app.post("/v1/menu-photo/edits", requireGatewayToken, async (c) => {
    const contentLength = Number(c.req.header("content-length") ?? "0");
    if (contentLength > config.maxJsonBytes) {
      throw new HttpError(413, "Request body is too large.", "payload_too_large");
    }

    const client = c.get("client");
    const payload = await c.req.json();
    const request = parseMenuPhotoEditRequest(payload);
    const usage = reserveRequest(client.id);
    const image = await imageEditor.editMenuPhoto(request);

    return c.json({
      usage,
      image,
    });
  });

  return app;
}
