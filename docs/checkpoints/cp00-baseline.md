# CP00: Run the baseline

**Goal:** chat with a working, durable agent before writing any code. (5 min)

## What is already wired

| Piece                  | Where                    | What it gives you                                                                                                      |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Worker entrypoint      | `src/server.ts`          | Validates the instance name, then `routeAgentRequest` forwards `/agents/assistant/<name>` to a Durable Object          |
| Durable Object + Think | `src/agent/assistant.ts` | `class Assistant extends Think`: the agentic loop, streaming, message persistence in SQLite, resumable streams, cancel |
| Model factory          | `src/agent/model.ts`     | Every model call goes through your AI Gateway; no gateway configured means a clear error, never a silent bypass        |
| React client           | `src/client/`            | `useAgent` (WebSocket, state sync, RPC) and `useAgentChat` (chat protocol) from the SDK                                |

You will not write WebSocket code, a chat protocol, or an agent loop today.

## Steps

```sh
npm ci
cp .dev.vars.example .dev.vars   # set AI_GATEWAY_ID to your gateway
npm run dev                       # http://localhost:5173
```

`npm run dev` runs the Worker locally but sends model calls to Workers AI in
your Cloudflare account, so you must be logged in (`npx wrangler login`).

## Verify

1. Send a message. The reply streams in.
2. Refresh the page. The conversation is still there (stored in the Durable Object's SQLite).
3. Open the same URL in a second tab. Same conversation.
4. Change the instance name in the header (for example `team-b`). Empty conversation: a different Durable Object.
5. In the Cloudflare dashboard, open **AI > AI Gateway > your gateway > Logs**. Your request is there.

## Common failures

| Symptom                                                               | Fix                                                                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `AI_GATEWAY_ID is not set`                                            | Create a gateway, put its id in `.dev.vars`, restart `npm run dev`                                                                         |
| `npm run dev` asks you to pick an account                             | Set `CLOUDFLARE_ACCOUNT_ID` in your shell                                                                                                  |
| `Failed to authenticate with Cloudflare Access` or `error code: 1050` | An Access policy covers your `*.workers.dev` subdomain. Local dev proxies the AI binding through a preview Worker there; ask the presenter |
| Model error mentioning billing or entitlement                         | Your account cannot use that model; pick another in the header                                                                             |

## Deploy (optional)

```sh
npm run deploy
```

Protect the deployed URL (for example with Cloudflare Access) before sharing it.
