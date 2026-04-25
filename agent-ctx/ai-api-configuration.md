# Z AI API configuration (CosmoGov)

This document and `ai-api.config.json` are the canonical references for an AI assistant (or a human) wiring up the **Z AI Web Dev** backend used by CosmoGov.

## What uses it

- **Package:** `z-ai-web-dev-sdk` (Z AI, OpenAI-style `chat.completions` API)
- **Factory:** `src/lib/z-ai-client.ts` → `createZAI()`
- **Routes:** `POST /api/ai/chat`, `POST /api/ai/debate/[id]/messages` (debate agent replies)

## How configuration is resolved

1. **Environment variables (recommended for Vercel / production)**  
   If both are set, they are used and **no file is read**:
   - `Z_AI_BASE_URL` — base URL of the Z AI HTTP API (SDK appends `/chat/completions`)
   - `Z_AI_API_KEY` — value sent as `Authorization: Bearer <apiKey>`

   Optional (sent as extra headers on each request, if the provider supports them):

   - `Z_AI_CHAT_ID` → `X-Chat-Id`
   - `Z_AI_USER_ID` → `X-User-Id`
   - `Z_AI_TOKEN` → `X-Token`

2. **Local file (development)**  
   If the two required env vars are **not** set, the SDK falls back to a JSON file named **`.z-ai-config`** in this order: project root, user home, `/etc/`. The file must contain at least:
   - `baseUrl` (string)
   - `apiKey` (string)  
   See `.z-ai-config.example` in the repo root. The real file is gitignored; do not commit secrets.

## Vercel

In **Project → Settings → Environment variables**, add at minimum `Z_AI_BASE_URL` and `Z_AI_API_KEY` (and optional keys above). This replaces `.z-ai-config` on the server, which is not practical for serverless.

## NVIDIA `integrate.api.nvidia.com` (OpenAI-compatible)

Matches the Python pattern:

- `base_url = "https://integrate.api.nvidia.com/v1"`
- `OpenAI(client)` + `client.chat.completions.create(model="deepseek-ai/deepseek-v4-pro", ...)`

**Env for this app (and CosmoGov server routes):**

- `Z_AI_BASE_URL=https://integrate.api.nvidia.com/v1`
- `Z_AI_API_KEY=<nvapi-…>`
- `Z_AI_MODEL=deepseek-ai/deepseek-v4-pro` (default in code if unset)

If the host name contains `nvidia.com` (or you set `Z_AI_USE_OPENAI_COMPAT=1`), requests go through **`src/lib/ai-completions.ts`**: a plain `POST` to `/v1/chat/completions` with `chat_template_kwargs: { thinking: false }` (same idea as your `extra_body` in Python). The bundled `z-ai-web-dev-sdk` is **not** used for that path, so vendor-specific `thinking` field injection does not apply.

- `Z_AI_SKIP_CHAT_TEMPLATE_KWARGS=1` — omit `chat_template_kwargs` if a model/API rejects it.

## What to do when asked to “configure the AI API”

1. Obtain `baseUrl` and `apiKey` from your Z AI / Z AI Web Dev provider.
2. **Production (Vercel):** set `Z_AI_BASE_URL` and `Z_AI_API_KEY` in Vercel; redeploy.
3. **Local dev:** copy `.z-ai-config.example` to `.z-ai-config` and fill in values, *or* add the same two variables to `.env` (and optionally `Z_AI_*` optionals) — the app’s `createZAI()` checks env first.

## Troubleshooting

- **503 on `/api/ai/chat` or debate messages:** the SDK could not read config, or the upstream API failed. Check env vars in the deployment, network reachability, and server logs.
- **Works locally but not on Vercel:** you almost certainly need `Z_AI_BASE_URL` + `Z_AI_API_KEY` in Vercel; the `.z-ai-config` file in the repo is not deployed in a way the SDK can rely on in production (and should stay gitignored when it contains secrets).
