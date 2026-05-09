import type { IncomingMessage, ServerResponse } from "node:http";
import { getRequestListener } from "@hono/node-server";

import { createApp } from "../src/hono-app.js";

export const config = {
  runtime: "nodejs",
};

const app = createApp();
const listener = getRequestListener(app.fetch);

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return listener(req, res);
}
