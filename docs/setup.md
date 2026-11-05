# Setup

## Prerequisites

- Node.js 24 or newer (`node -v`)
- A Cloudflare account where you can deploy Workers and use Workers AI
- Any editor or coding assistant

Some models in the picker (DeepSeek, GLM) need the Workers Paid plan or AI
Gateway credits. If one fails with a billing or entitlement error, choose another.

## 1. Install

```sh
git clone <starter repo url>
cd <repo>
npm ci
```

`npm ci` installs the exact versions in `package-lock.json`.

## 2. Create an AI Gateway

Dashboard: **AI > AI Gateway > Create Gateway**. Note its id.

The app sends every model call through this gateway, so you can see each
request, its latency, and token usage in the gateway's **Logs** tab. You do not
need a gateway token: calls made through the Worker's `AI` binding are already
authenticated to your account, even with Authenticated Gateway turned on.

## 3. Configure local secrets

```sh
cp .dev.vars.example .dev.vars
```

Set `AI_GATEWAY_ID` in `.dev.vars`. That file is git-ignored.

## 4. Log in and run

```sh
npx wrangler login
npm run dev
```

Open http://localhost:5173.

If your login can see more than one account, set the account first:

```sh
export CLOUDFLARE_ACCOUNT_ID=<your account id>
```

### Why local dev needs your account

The Worker, Durable Object, and SQLite run locally. The model cannot. For the
`AI` binding, `npm run dev` uploads a temporary preview Worker to
`<worker-name>.<your-subdomain>.workers.dev` and forwards model calls through
it. Local model calls are real, billed, and logged in your gateway.

If a Cloudflare Access policy, or the Zero Trust setting that denies requests
not matched by any Access application, covers that hostname, local model calls
fail with one of:

- `Failed to authenticate with Cloudflare Access`
- `error code: 1050`
- `Too many redirects ... cloudflareaccess.com/cdn-cgi/access/login/...`

Fix: exclude the preview hostname from Access (a bypass rule), or use a
different Worker name for dev.

## 5. Deploy

```sh
npm run deploy
```

This builds the client and Worker and runs `wrangler deploy`. Set the gateway id
for production in `wrangler.jsonc` (`vars.AI_GATEWAY_ID`), then run
`npm run types`.

The app has no login of its own. Before sharing the deployed URL, put it behind
Cloudflare Access. See [security](security.md).

## 6. Clean up

```sh
npx wrangler delete
```

This deletes the deployed Worker. Confirm in the dashboard (**Workers &
Pages** and **Durable Objects**) that its Durable Object namespace and data are
gone. Delete the gateway in the dashboard if you created one for the webinar.

## Troubleshooting

| Symptom                                                   | Cause and fix                                                                    |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `AI_GATEWAY_ID is not set`                                | Set it in `.dev.vars` (local) or `wrangler.jsonc` vars (deployed)                |
| `wrangler whoami` seems to hang                           | Your login sees many accounts; set `CLOUDFLARE_ACCOUNT_ID`                       |
| Reply never arrives, server log shows `CloudflareAIError` | Model not available to your account, or gateway misconfigured; try another model |
| Page loads but `/agents/...` returns HTML                 | `assets.run_worker_first` must include `/agents/*` in `wrangler.jsonc`           |
| `@callable` methods missing at runtime                    | The `agents/vite` plugin must be in `vite.config.ts` and `vitest.config.ts`      |
| Types out of date after editing `wrangler.jsonc`          | `npm run types`                                                                  |
