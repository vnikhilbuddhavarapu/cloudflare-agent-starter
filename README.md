# Cloudflare Agent Starter: Build a Durable, Stateful AI Agent

A hands-on starter for the Cloudflare developer webinar. You start from a
working chat agent, add core agent capabilities step by step, deploy it to
your own Cloudflare account, and leave with a live app you can keep building.

Built with the Cloudflare Agents SDK, the Think harness, SQLite-backed Durable
Objects, AI Gateway, React, and Vite. Use synthetic data only.

## What you will build

| Capability                                              | Checkpoint                                     | Cloudflare primitive                            |
| ------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Accept a request, call a model, stream the reply        | [CP00](docs/checkpoints/cp00-baseline.md)      | Worker + Durable Object + Think + AI Gateway    |
| Maintain validated state across tabs and refreshes      | [CP01](docs/checkpoints/cp01-state.md)         | Agent state, `@callable`, `validateStateChange` |
| Keep useful context in bounded memory                   | [CP02](docs/checkpoints/cp02-memory.md)        | Think context blocks                            |
| Make typed tool calls with structured results           | [CP03](docs/checkpoints/cp03-tools.md)         | AI SDK `tool()` + Zod + Durable Object SQLite   |
| Schedule durable work that runs with the browser closed | [CP04](docs/checkpoints/cp04-reminders.md)     | `this.schedule()`                               |
| Deploy a live app and submit it                         | [CP05](docs/checkpoints/cp05-deploy-submit.md) | `wrangler deploy` to `*.workers.dev`            |

Finished early? Pick a [stretch goal](docs/stretch-goals.md).

## Before the session

Follow the [preflight checklist](docs/preflight.md). It takes about 10 minutes.

## Quick start

Requires Node.js 24+ and a Cloudflare account.

```sh
npm ci
cp .dev.vars.example .dev.vars    # set AI_GATEWAY_ID
npx wrangler login
npm run dev                        # http://localhost:5173
```

Then follow [the checkpoints](docs/checkpoints/README.md), starting with
[CP00](docs/checkpoints/cp00-baseline.md). Each checkpoint has a test command
that turns green when you're done, and hints that go up to the full code.

## Submit your build (prizes)

We pick three winners after the session. No live demo needed.

**Submission form:** https://forms.gle/REPLACE_WITH_FORM_ID

Submit:

1. Your deployed app URL (`https://cloudflare-agent-starter.<your-subdomain>.workers.dev`)
2. Your GitHub repo or code link, if shareable
3. A 2 to 3 sentence description of what your agent does
4. The checkpoint or stretch goal you reached

| Category                 | What wins                                                |
| ------------------------ | -------------------------------------------------------- |
| Best Working Agent       | The most complete end-to-end build                       |
| Best Real-World Use Case | The most practical real-world agent workflow             |
| Best Builder Creativity  | The best stretch goal, customization, or technical twist |

Winners are announced by email after submissions are reviewed.

## Commands

| Command                           | What it does                                                     |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                     | Local dev server (model calls still go to your account)          |
| `npm test`                        | Baseline tests; pass before and after every exercise             |
| `npm run test:cp01` … `test:cp04` | Checkpoint tests; red until that exercise is done                |
| `npm run typecheck`               | TypeScript for Worker and test code                              |
| `npm run check` / `check:fix`     | Lint and format (Biome)                                          |
| `npm run deploy`                  | Build and deploy to your account                                 |
| `npm run test:e2e`                | Live end-to-end tests against a running app (uses model credits) |

## Docs

- [Preflight checklist](docs/preflight.md)
- [Setup](docs/setup.md) and troubleshooting
- [Architecture](docs/architecture.md): primitives, request paths, recovery guarantees, limits
- [Checkpoints](docs/checkpoints/README.md)
- [Stretch goals](docs/stretch-goals.md)
- [Security](docs/security.md)
- [Cloudflare skills for your coding assistant](docs/skills.md)
- [Extensions](docs/extensions/README.md): optional MCP and Dynamic Workers (off by default)
- [AGENTS.md](AGENTS.md): guidance for coding assistants

## Repo map

```
src/server.ts            Worker entry: validates instance names, routes to the agent
src/agent/assistant.ts   The agent: a thin Think subclass composing everything below
src/agent/model.ts       Model construction through AI Gateway
src/agent/state.ts       CP01: shared settings contract and validation
src/agent/session.ts     CP02: system identity and memory blocks
src/agent/tools/         CP03, CP04: typed tools, composed in index.ts
src/agent/tasks/         CP04: scheduled callback logic
src/agent/store/         Durable Object SQLite records (provided)
src/shared/contracts.ts  Browser-safe types and schemas
src/client/              React UI: chat, inspector, layout
tests/                   unit, integration, checkpoints, e2e
```
