# townino-ai-gateway

Thin server-side OpenAI image gateway for Townino.

The service keeps `OPENAI_API_KEY` on the server. Townino calls it with a
server-to-server bearer token and receives a generated image data URL.

## Endpoints

- `GET /health`
- `POST /v1/menu-photo/edits`

`POST /v1/menu-photo/edits` creates a new menu image with OpenAI
`/v1/images/edits` and `gpt-image-2`. The caller supplies the source image data
URL and a complete prompt. Style templates live in Townino, while the OpenAI
model, output format, quality, and size are fixed by this gateway.

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Minimum local `.env`:

```env
OPENAI_API_KEY=...
TOWNINO_AI_GATEWAY_TOKEN=dev-local-token
```

## Smoke Test

```bash
curl http://127.0.0.1:8788/health
```

## Production Notes

- Deploy this folder as a separate Vercel project.
- In the gateway Vercel project, set:
  - `OPENAI_API_KEY`
  - `TOWNINO_AI_GATEWAY_TOKEN`
  - `TOWNINO_IMAGE_MODEL=gpt-image-2`
  - `TOWNINO_IMAGE_OUTPUT_FORMAT=jpeg`
  - `TOWNINO_IMAGE_QUALITY=medium`
  - `TOWNINO_IMAGE_SIZE=1536x1024`
- In the Townino Vercel project, set:
  - `TOWNINO_AI_GATEWAY_URL`
  - `TOWNINO_AI_GATEWAY_TOKEN`
- If the caller sends image policy fields like `quality` or `size`, the gateway
  ignores them and uses its own configured policy.
