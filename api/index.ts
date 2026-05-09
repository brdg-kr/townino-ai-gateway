import { handle } from "hono/vercel";

import { createApp } from "../src/hono-app.js";

export const config = {
  runtime: "nodejs",
};

export default handle(createApp());
