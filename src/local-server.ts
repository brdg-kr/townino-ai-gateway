import { serve } from "@hono/node-server";

import { config } from "./config.js";
import { createApp } from "./hono-app.js";

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`townino-ai-gateway listening on http://127.0.0.1:${info.port}`);
  }
);
