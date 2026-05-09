import assert from "node:assert/strict";
import test from "node:test";

process.env.OPENAI_API_KEY = "test-openai-key";
process.env.TOWNINO_AI_GATEWAY_TOKEN = "test-gateway-token";
process.env.TOWNINO_DAILY_REQUEST_LIMIT = "2";

const { createApp } = await import("../src/hono-app.js");

const sourceDataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z8BQDwAFgwJ/lcH6IwAAAABJRU5ErkJggg==";

test("health endpoint is public", async () => {
  const app = createApp();
  const response = await app.request("/health");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "townino-ai-gateway");
  assert.equal(body.model, "gpt-image-2");
  assert.equal(body.outputFormat, "jpeg");
  assert.equal(body.quality, "medium");
  assert.equal(body.size, "1536x1024");
});

test("protected routes require a bearer token", async () => {
  const app = createApp();
  const response = await app.request("/v1/me");
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "missing_token");
});

test("gateway token authenticates server requests", async () => {
  const app = createApp();
  const response = await app.request("/v1/me", {
    headers: {
      Authorization: "Bearer test-gateway-token",
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.client.id, "townino");
});

test("invalid image model is rejected before provider call", async () => {
  const app = createApp();
  const response = await app.request("/v1/menu-photo/edits", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-gateway-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "not-allowed",
      prompt: "Create a clean restaurant menu photo from this source image.",
      image: { dataUrl: sourceDataUrl },
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "model_not_allowed");
});

test("menu photo edit returns generated image data from the injected editor", async () => {
  const app = createApp({
    imageEditor: {
      async editMenuPhoto(input) {
        assert.equal(input.model, "gpt-image-2");
        assert.equal(input.outputFormat, "jpeg");
        assert.equal(input.quality, "medium");
        assert.equal(input.size, "1536x1024");
        return {
          model: input.model,
          outputFormat: input.outputFormat,
          contentType: "image/jpeg",
          dataUrl: "data:image/jpeg;base64,ZmFrZS1pbWFnZQ==",
        };
      },
    },
  });

  const response = await app.request("/v1/menu-photo/edits", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-gateway-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt:
        "Create a clean official restaurant menu photo while preserving the dish identity.",
      image: { dataUrl: sourceDataUrl },
      outputFormat: "png",
      quality: "low",
      size: "1024x1024",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.image.model, "gpt-image-2");
  assert.equal(body.image.dataUrl, "data:image/jpeg;base64,ZmFrZS1pbWFnZQ==");
});
