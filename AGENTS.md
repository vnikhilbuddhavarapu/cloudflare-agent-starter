# AGENTS.md

Guidance for coding assistants working in this repository. This is repository
guidance, not the deployed agent's system prompt and not an access policy.

## Purpose

A general-purpose, durable chat agent on Cloudflare used in the Cloudflare developer webinar
"Building Durable and Stateful Agents". Synthetic data only. No PHI, no
production credentials.

## Stack (pinned, exact versions in package.json)

TypeScript, React 19, Vite 8, Cloudflare Workers, Agents SDK (`agents`),
Think (`@cloudflare/think`), AI SDK v7 (`ai`), Zod 4, Biome, Vitest with
`@cloudflare/vitest-plugin`. Node.js 24+. One package manager: npm.

## Commands

| Task                            | Command                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| Install                         | `npm ci`                                                         |
| Generate binding types          | `npm run types` (after any `wrangler.jsonc` change)              |
| Dev server                      | `npm run dev` (model calls are remote and billed)                |
| Lint + format check             | `npm run check` (`npm run check:fix` to apply)                   |
| Typecheck                       | `npm run typecheck`                                              |
| Baseline tests                  | `npm test`                                                       |
| Checkpoint tests                | `npm run test:cp01` … `test:cp04`, `npm run test:checkpoints`    |
| All deterministic tests         | `npm run test:all`                                               |
| Live e2e (credits, running app) | `npm run test:e2e` with `E2E_BASE_URL`                           |
| Build / deploy                  | `npm run build` / `npm run deploy`                               |
| Optional extensions             | `npm run dev:extensions`, `test:extensions`, `deploy:extensions` |

Extensions (read-only MCP client, Dynamic Workers) live in
`src/agent/extensions/` and are active only in the `extensions` wrangler
environment. MCP servers and tools come from the allowlist in `config.ts`;
never accept an MCP URL from a client. Dynamic Worker code must set
`globalOutbound: null`, pass `env: {}` or explicitly granted capabilities only,
and validate output. See `docs/extensions/`.

Before reporting work as done, run `check`, `typecheck`, the relevant tests,
and `build`. Report exactly what you ran and what you did not.

## Repo map

| Path                              | Responsibility                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/server.ts`                   | Worker entry: instance-name validation, `routeAgentRequest`. No tool logic                           |
| `src/agent/assistant.ts`          | Thin `Think` subclass: composes model, context, tools, state; `@callable` RPC; SDK callback adapters |
| `src/agent/model.ts`              | The only place models are constructed. Always through AI Gateway                                     |
| `src/agent/state.ts`              | State contract, validation, fixed prompt text per setting                                            |
| `src/agent/session.ts`            | Context blocks: read-only identity, writable bounded memory                                          |
| `src/agent/tools/`                | One file per capability; composed explicitly in `index.ts`                                           |
| `src/agent/tasks/`                | Scheduled-callback logic                                                                             |
| `src/agent/store/`                | Durable Object SQLite records                                                                        |
| `src/shared/contracts.ts`         | Browser-safe schemas and types only                                                                  |
| `src/client/`                     | UI. Renders SDK state and server records only; never invents backend activity                        |
| `tests/unit`, `tests/integration` | Baseline (must always pass)                                                                          |
| `tests/checkpoints`               | One suite per checkpoint                                                                             |
| `tests/e2e`                       | Live, against a running app                                                                          |

Files containing `EXERCISE CPxx` comments are lab exercises. Do not
complete them unless the user asks.

## Primitive ownership (do not blur these)

- **Identity:** instance name selects a Durable Object. Not authentication.
- **Conversation history:** Think's persisted transcript.
- **State:** small validated JSON, server-written via `@callable` methods, synced to clients.
- **Memory:** Think context block, model-writable, token-bounded, per instance.
- **Model context:** what one model call sees: system prompt, recent history, memory reminder.
- **Application records:** notes and reminders in Durable Object SQLite via `store/`.
- **Scheduling:** `this.schedule()`; at-least-once callbacks, idempotent completion.

## How to add things

- **Tool:** new file in `src/agent/tools/`, export a factory returning AI SDK `tool()`s with Zod input schemas; add one line in `tools/index.ts`; add a store in `store/` if it persists; use `toolCallId` as the operation key for mutations; test it in `tests/` by calling `execute` directly.
- **State field:** add it to `AppStateSchema` and `initialState`; expose a narrow `@callable` setter that validates its argument; never spread client objects into state or prompts.
- **Context block:** add it in `session.ts`; give writable blocks `maxTokens`.
- **Scheduled callback:** add a method on `Assistant` that delegates to `tasks/`; make completion idempotent; persist before notifying clients.

## Invariants

- Never rename the `Assistant` class or its binding. Append migrations; never edit a deployed migration tag.
- Never add a direct Workers AI path that bypasses `model.ts` and AI Gateway.
- Never put credentials or bindings in `src/shared` or `src/client`.
- Never render model output as raw HTML.
- Validate every untrusted input at runtime (RPC args, tool input, state writes, instance names).
- Do not add services (D1, KV, R2, vector DBs) without a stated need.

## Style

Biome formatting (tabs, double quotes). Comments explain why, not what. No
`any`. No silent catch blocks. Small cohesive modules; no plugin frameworks.

## Docs and version conflicts

Consult current docs before using an SDK API, then check the installed types
in `node_modules` because pinned versions can lag the docs:

- Think: https://developers.cloudflare.com/agents/harnesses/think/
- Agents SDK: https://developers.cloudflare.com/agents/
- AI SDK provider and Gateway: https://developers.cloudflare.com/agents/models/ai-sdk/
- Durable Objects: https://developers.cloudflare.com/durable-objects/

Record any doc/type conflict and its resolution in the PR or commit message.

## Never

Commit secrets or `.dev.vars`; use real personal or health data; fabricate
test results, logs, or deployment evidence; provision paid resources or enable
third-party services without explicit approval.
