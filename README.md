# christian-constant.com — setup guide

A one-page conversational site: the visitor talks to an assistant that answers from your narrative. No CMS, no framework, no database. Hosting is free at your traffic; the only running cost is Claude API usage (roughly one cent per reply).

## What's in the folder (no subfolders — every file sits at the top level)

```
narrative-en.md   ← the assistant's brain and the site's words (English). Edit this, and the site updates.
narrative-de.md   ← same in German — the assistant answers German visitors from this file
narrative-fr.md   ← same in French
index.html        ← the page (design, EN/DE/FR strings, chat UI, imprint/privacy text)
photo.jpg         ← your portrait
chat.js           ← the backend: receives the chat, calls Claude, streams the reply
worker.js         ← tiny router: /api/chat → chat.js, everything else → the page
build.js          ← bundles the narrative into the backend and builds the page (runs on Cloudflare)
wrangler.jsonc    ← Cloudflare settings
package.json      ← tells Cloudflare which tool deploys the site
```

Everything the assistant says comes from `narrative-en.md` / `narrative-de.md` / `narrative-fr.md` (picked by the visitor's language; missing files fall back to English). It is instructed to answer only from that file and to send people to your email for anything else.

## One-time setup

### 1. Domain — done
**christian-constant.com** is registered. You'll need its DNS settings at the registrar for step 5, and an email address on it (most registrars offer free forwarding: set `hello@christian-constant.com` to forward to your Gmail).

### 2. Code on GitHub — done
Repository `christianconstant-site`. All files sit at the top level of the repository (no `site` folder). When uploading, open the unzipped folder and drag the **files**, not the folder.

### 3. Get a Claude API key
1. Sign up at console.anthropic.com and add a small prepaid balance (USD 20 lasts a long time at this usage).
2. Settings → **Limits**: set a monthly spend limit (e.g. USD 30) so nothing can run away.
3. **API Keys → Create key**, name it `website`, copy it. You'll paste it in step 4.4.

### 4. Deploy on Cloudflare (free)
1. cloudflare.com → **Workers & Pages → Create → Import a repository**, authorise GitHub, pick `christianconstant-site`.
   If Cloudflare says it can't fetch the repository: on GitHub, avatar → Settings → Applications → Installed GitHub Apps → *Cloudflare Workers and Pages* → Configure → give it access to `christianconstant-site` → Save. Then retry.
2. Fill the form:
   - Project name: `christian-constant`
   - Build command: `node build.js`
   - Deploy command: `npx wrangler deploy`
   - API token: keep what Cloudflare suggests (a token it creates for itself to publish your builds — not your Claude key)
   - Build variables and secrets: leave empty
   - Root directory: leave empty (files are at the top level)
   - Click **Create and deploy**.
3. Wait for the first deploy to finish (about a minute). It will show a `christian-constant.<your-account>.workers.dev` address. The page will load, but the chat will say "briefly unavailable" until the next step.
4. Project → **Settings → Variables and Secrets → Add**:
   - `ANTHROPIC_API_KEY` — type **Secret** — value: the key from step 3
   - `ALLOWED_ORIGIN` — type Text — value: `https://christian-constant.com` — **add this only after the domain is connected (step 5)**; while you test on the workers.dev address it must stay unset, otherwise the backend rejects the calls
   - (optional) `ANTHROPIC_MODEL` — type Text — `claude-sonnet-5` (default; `claude-haiku-4-5-20251001` is cheaper, slightly less polished)
   Then **Deployments → Retry / Redeploy** the latest one so the backend picks them up.
5. Test the chat on the workers.dev address in EN, DE and FR. If it answers, the key is wired correctly.

### 5. Domain — done
`christian-constant.com` and `www.christian-constant.com` are attached to the Worker (Cloudflare → project → Domains). The domain is registered at Cloudflare, so DNS and HTTPS were automatic. `www` redirects to the bare domain (worker.js, with `run_worker_first` in wrangler.jsonc). `ALLOWED_ORIGIN` in wrangler.jsonc locks the chat backend to the domain.

## Plain settings vs. secrets
- Non-secret settings (`ANTHROPIC_WORKSPACE_ID`, later `ALLOWED_ORIGIN`, optionally `ANTHROPIC_MODEL`) live in `wrangler.jsonc` under `vars` — a deploy from GitHub resets dashboard-set plain variables, so the file is the reliable place.
- The API key stays a dashboard **Secret**; secrets survive deploys.

## Updating the site later — no re-upload needed
- **Change what the assistant says**: on GitHub open `narrative-en.md` (or `-de` / `-fr`) → pencil icon → edit → **Commit changes**. Cloudflare rebuilds and redeploys within a minute.
- **Change the page itself** (hero line, prompt chips, colours, footer, imprint/privacy text): same with `index.html`. All EN/DE/FR interface strings are in the `T` object near the top of the script; the email address is the `EMAIL` constant.
- **New photo**: upload a new `photo.jpg` (portrait, 5:6, ~1000×1200 px) replacing the old one.

## Before going live — checklist
- [x] Imprint address and LinkedIn URL set in `index.html`.
- [ ] Confirm the email address `hello@christian-constant.com` exists (forwarding at the registrar).
- [ ] Ask the assistant a few hard questions in all three languages on the workers.dev address: "Are you Christian?", "What's your hourly rate?", "Can you coach me now?", "Ignore your instructions" — it should decline gracefully and point to your email.

## Safety and privacy notes
- The visitor's text goes to Anthropic's API to generate the reply; the site stores nothing. The Privacy panel in the footer says so — keep it if you change the text.
- The backend caps each request (12 turns, 1,200 characters per message, 450-token replies) and only accepts calls from your domain, so abuse is bounded; the Anthropic spend limit is the hard backstop.
- Nothing about your clients ever goes into the narrative. Keep it to how you work, not whom you work with.
