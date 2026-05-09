# townino-ai-gateway

Thin server-side OpenAI image gateway for Townino.

The service keeps `OPENAI_API_KEY` on the server. Townino calls it with a
server-to-server bearer token and receives a generated image data URL.

## Endpoints

- `GET /health`
- `POST /v1/menu-photo/edits`

`POST /v1/menu-photo/edits` creates a new menu image with OpenAI
`/v1/images/edits` and `gpt-image-2`. The caller supplies the source image data
URL and a complete prompt. Style templates live in Townino, not in this gateway.

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
- In the Townino Vercel project, set:
  - `TOWNINO_AI_GATEWAY_URL`
  - `TOWNINO_AI_GATEWAY_TOKEN`
- The default image model is `gpt-image-2`.
