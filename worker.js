// Cloudflare Worker entry.
// Routes /api/chat to chat.js; everything else is served as a static file from public/.
import { onRequestPost, onRequestGet } from "./chat.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) return Response.redirect("https://" + url.hostname.slice(4) + url.pathname + url.search, 301);
    if (url.pathname === "/api/chat") {
      return request.method === "POST" ? onRequestPost({ request, env }) : onRequestGet();
    }
    return env.ASSETS.fetch(request);
  },
};
