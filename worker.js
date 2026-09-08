// Cloudflare Worker entry.
// Routes /api/chat to chat.js; everything else is served as a static file from public/.
import { onRequestPost, onRequestGet } from "./chat.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") {
      return request.method === "POST" ? onRequestPost({ request, env }) : onRequestGet();
    }
    return env.ASSETS.fetch(request);
  },
};
