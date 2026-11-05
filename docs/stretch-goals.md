# Stretch goals

Finished the checkpoints? Start with the two featured stretch goals. They are
already built into the repo and switched off; you turn them on, see them work,
then extend them.

## Featured stretch 1: MCP tools (read-only)

Your agent connects as an **MCP client** to Cloudflare's documentation MCP
server and gets one read-only tool, `search_cloudflare_documentation`.

```sh
npm run dev:extensions          # uses the "extensions" environment in wrangler.jsonc
```

1. Ask: "Use the Cloudflare documentation search tool to explain Durable Object alarms."
2. An **MCP** tool card appears; the inspector's instance card shows `MCP: cloudflare-docs · 1 tool`.
3. Extend it: read `src/agent/extensions/config.ts`. Servers and allowed tools
   come from an allowlist in code, never from the browser.

Details: [extensions/mcp.md](extensions/mcp.md).

## Featured stretch 2: Dynamic Workers (isolated code)

An `analyzeNotes` tool runs JavaScript in a separate Worker loaded at runtime,
with no network, no bindings, and CPU limits. Needs the Workers Paid plan
(lab accounts have it).

```sh
npm run dev:extensions
npm run test:extensions         # real Worker Loader tests
```

1. Save two notes, then ask: "Analyze my notes with the analyzeNotes tool."
2. The card **Analyze notes (isolated)** shows stats computed inside the sandbox.
3. Extend it: change `NOTE_STATS_SOURCE` in `src/agent/extensions/dynamic.ts`
   (for example, count words per note) and update `NoteStatsSchema` to match.

Deploy both: `npm run deploy:extensions` (a separate Worker named
`cloudflare-agent-starter-extensions`; set `AI_GATEWAY_ID` under
`env.extensions.vars` in `wrangler.jsonc` first).

Details: [extensions/dynamic-workers.md](extensions/dynamic-workers.md).

---

## More ideas

Each lists where to start. Your coding assistant plus
[AGENTS.md](../AGENTS.md) will get you most of the way.

## Make it yours (Best Real-World Use Case)

- **Change the agent's job.** Edit `SOUL` in `src/agent/session.ts`: a study
  buddy, an on-call helper, a recipe planner, a travel organiser.
- **Rename and reshape notes.** Notes can become tasks, bookmarks, incidents or
  shopping items. Change the schema in `tools/notes.ts` and the store in
  `store/notes.ts`.
- **Add a setting.** A new state field (language, persona, units) following the
  CP01 pattern: schema in `contracts.ts`, a `@callable` setter, fixed prompt text.

## Better tool calls (Best Working Agent)

- **Add a tool.** For example `deleteNote`, `searchNotes`, or `completeTask`.
  Follow "How to add things" in AGENTS.md and test it by calling `execute`
  directly, like `tests/checkpoints/cp03-notes.test.ts`.
- **Return a next action.** Have a tool return `{ result, nextAction }` and
  tell the model in the description to suggest the next step.
- **Recurring reminders.** `this.schedule()` also accepts a cron string, for
  example `"0 9 * * 1"` for Mondays at 9:00.

## Richer memory

- **A second block.** Add a read-only block whose provider returns today's date
  or your notes count, so the model always has it.
- **Structured memory.** Ask the model to keep memory as a short bullet list
  with categories; tune the `description`.

## UI polish

- Add a delete button to notes in `src/client/components/inspector/NotesSection.tsx`
  (pair it with a `@callable` on the server).
- Theme the app: colours are tokens at the top of `src/client/styles.css`.

## Observability

- Turn on traces: in `wrangler.jsonc` set
  `"observability": { "enabled": true, "traces": { "enabled": true } }`, deploy,
  then open **Workers & Pages > your Worker > Observability**.
- Look at AI Gateway **Logs** and **Analytics** for token counts and latency.
- Add AI Gateway caching or rate limits from the dashboard.

## Production-ready workflow

- Protect your URL with Cloudflare Access.
- Derive the instance name from the logged-in user on the server, so each person
  gets their own agent.

When you submit, say which stretch goal you reached.
