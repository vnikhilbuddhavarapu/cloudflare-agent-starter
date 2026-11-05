# Architecture

```
Browser (React)
  useAgent        WebSocket: state sync, RPC (@callable), custom broadcasts
  useAgentChat    chat protocol over the same socket; GET /get-messages on load
        |
        v
Worker  src/server.ts
  validate instance name -> routeAgentRequest(/agents/assistant/<name>)
        |
        v
Durable Object  Assistant extends Think          (one per instance name)
  Think        agent loop, streaming, transcript in SQLite, resumable streams
  state        this.state / setState / validateStateChange
  context      soul (read-only) + memory (writable, bounded)
  tools        saveNote, listNotes, scheduleReminder, listReminders, set_context
  schedule     this.schedule() -> alarm -> onReminderDue
  SQLite       transcript, state, memory, notes, reminders, schedules
        |
        v
model.ts -> createAI({ binding: env.AI, id: AI_GATEWAY_ID }) -> AI Gateway -> Workers AI model
```

## Request paths

- **Chat turn:** client sends over WebSocket. Think persists the user message,
  calls `beforeTurn` (adds the response-style instruction and limits active
  tools), streams model output, runs tools, persists the assistant message,
  and broadcasts to every client on the instance.
- **Setting change:** client calls `stub.setResponseStyle(style)` (RPC over the
  socket). The server validates the argument, calls `setState`,
  `validateStateChange` checks the whole object, the SDK saves it and
  broadcasts it.
- **Records:** tools write SQLite through `store/`, then broadcast
  `records-changed`; clients re-read records over RPC.
- **Reminder:** the tool registers `schedule(delaySeconds, "onReminderDue")`,
  then writes the record. When due, the platform wakes the Durable Object and
  calls the callback, even with no clients connected.

## What each primitive is (and is not)

| Concept                  | Where it lives                   | Survives                        | Notes                                                                                     |
| ------------------------ | -------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| **Identity**             | Instance name in the URL         | n/a                             | Selects a Durable Object. It is not authentication or authorization                       |
| **Conversation history** | Think transcript in SQLite       | refresh, restart, deploy        | Cleared by "clear history"                                                                |
| **Application state**    | `this.state` in SQLite           | refresh, restart                | Small, validated, server-written, broadcast to all clients                                |
| **Memory**               | Context block `memory` in SQLite | refresh, restart, clear history | Model-writable via `set_context`, max 1,000 tokens, per instance                          |
| **Model context**        | Built per model call             | one call                        | System prompt (frozen for caching) + recent history + memory reminder + style instruction |
| **Application records**  | `notes`, `reminders` tables      | refresh, restart                | Written only by tools and callbacks                                                       |
| **Schedules**            | SDK schedule table + alarm       | restart, deploy                 | At-least-once delivery                                                                    |

Memory is per agent instance in this app. There is no memory shared across
instances.

## Recovery guarantees are separate

| Situation                               | What happens                                                                                                     | Verified here                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Browser refresh or reconnect            | The socket reconnects; the client reloads the transcript; Think replays buffered chunks of an in-progress stream | Refresh persistence: yes (e2e). Mid-stream replay: not rehearsed |
| Durable Object evicted between turns    | Next request rebuilds it from SQLite                                                                             | Yes (integration tests use eviction)                             |
| Server interrupted during inference     | Think has a chat-recovery mechanism; this app uses its defaults                                                  | Not verified in this app                                         |
| Tool retried with the same call id      | Notes and reminders return the original record                                                                   | Yes (integration tests)                                          |
| Schedule callback delivered twice       | Completion is a single `pending -> completed` transition                                                         | Yes (integration tests)                                          |
| External side effects (email, payments) | Not implemented. Would need downstream idempotency keys                                                          | n/a                                                              |

A durable schedule is not a promise of exact wall-clock delivery or of
exactly-once external effects.

## Module boundaries

- `assistant.ts` composes; it holds no business logic beyond thin adapters.
- `model.ts` is the only place models are constructed.
- `tools/*` own schemas and behaviour; `index.ts` composes them explicitly.
- `store/*` own SQL. Tables use `CREATE TABLE IF NOT EXISTS`, so no migration
  step is needed when a capability is added.
- `shared/contracts.ts` is imported by both browser and Worker, so it must stay
  free of bindings and server code.

## Limits

| Limit               | Value               | Where                                         |
| ------------------- | ------------------- | --------------------------------------------- |
| Tool steps per turn | 6                   | `LIMITS.maxSteps`                             |
| Memory              | 1,000 tokens        | `LIMITS.memoryTokens`                         |
| Note title / body   | 80 / 2,000 chars    | `LIMITS`                                      |
| Reminder delay      | 10 s to 7 days      | `LIMITS`                                      |
| Composer input      | 4,000 chars         | `Composer.tsx` (UX only, not a server limit)  |
| Instance name       | 1-48 of `[a-z0-9-]` | `InstanceNameSchema`, enforced in `server.ts` |

## Configuration choices

- `compatibility_date` is pinned to the newest date the bundled workerd supports.
- `beforeTurn` restricts active tools to this app's tools plus `set_context`,
  because Think always merges its workspace file tools.
- The memory block uses `whenChanged: "remind"` because `set_context` does not
  rebuild the frozen system prompt.
