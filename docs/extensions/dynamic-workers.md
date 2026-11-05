# Extension: Dynamic Workers for isolated tool execution

**Off by default.** Requires the Workers Paid plan and the Worker Loader
binding, which only the `extensions` wrangler environment declares.

## What it shows

The agent's loop, state, and records stay in the Think Durable Object. One
tool's computation runs in a **separate isolate loaded at runtime** with no
network and no bindings.

```
User: "Analyze my notes"
  -> Think selects analyzeNotes
  -> Host reads note metadata (titles, lengths, dates; never bodies), checks input size
  -> env.LOADER.get(id, code)  -> isolated Dynamic Worker
  -> Instructor-provided JavaScript computes stats
  -> Host reads a bounded response, validates it with Zod
  -> Think receives the tool result and continues
```

This is not a browser Web Worker, a container, a Durable Object, or `eval` in
the host.

## Guardrails (src/agent/extensions/dynamic.ts)

| Guardrail         | Setting                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Network           | `globalOutbound: null`: `fetch()` and `connect()` throw. Omitting it would inherit the host's network                             |
| Bindings          | `env: {}`: no secrets, storage, model, or parent env                                                                              |
| CPU               | `limits.cpuMs: 50` per invocation                                                                                                 |
| Subrequests       | `limits.subRequests: 0`                                                                                                           |
| Input             | 32 KiB max, checked before loading                                                                                                |
| Output            | 8 KiB max, read incrementally and cancelled when exceeded                                                                         |
| Output shape      | Strict Zod schema; anything else is a tool error                                                                                  |
| Response deadline | 5 s `AbortSignal.timeout`: the host stops waiting. This does **not** terminate the isolate; `cpuMs` does                          |
| Errors            | Syntax errors, thrown exceptions, limits, bad JSON become a `DynamicToolError` with a one-line message; no stacks reach the model |
| Isolate cache     | `get(id, …)` with `id = sha256(code + config)`, so changed code or limits never reuse a warm isolate                              |
| Code              | Plain JavaScript string; the loader does not compile TypeScript                                                                   |
| State             | The isolate keeps nothing; the host's SQLite is authoritative                                                                     |

## Run it

```sh
npm run dev:extensions
```

Save a couple of notes, then: "Analyze my notes with the analyzeNotes tool."
The card is labelled **Analyze notes (isolated)**; the inspector shows
`Dynamic Workers: on`.

Deploy (separate Worker named `cloudflare-agent-starter-extensions`):

```sh
npm run deploy:extensions
```

## Tests

`npm run test:extensions` runs against a real local Worker Loader:

- fixture produces the expected JSON
- the agent's `analyzeNotes` tool uses the same executor
- outbound `fetch` is blocked
- the isolate sees no env keys
- syntax error, thrown exception (no stack leak), oversized input, oversized
  output, and invalid JSON all produce controlled errors
- changed code never hits a stale cached isolate

Live (model chooses the tool): `tests/e2e/extensions.e2e.test.ts`.

**Not verified locally:** CPU-limit termination. Local workerd does not enforce
`cpuMs`; an infinite loop hung the local test process. Verify on a deployed
extensions Worker before claiming it.

## Cost

Using `get()` with a stable id avoids being billed for a new Dynamic Worker per
call. See https://developers.cloudflare.com/dynamic-workers/pricing/.

## Stage two (not built)

Give the isolate a narrow, read-only host capability through a loopback
service binding (`ctx.exports.SomeEntrypoint({ props })`). Enforce instance
scoping and authorization inside that host method, never in the generated code
or the prompt.
