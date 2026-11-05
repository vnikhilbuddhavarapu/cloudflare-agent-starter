# Checkpoints

Each checkpoint adds one capability to a working agent. You fill in a small,
marked exercise (`EXERCISE CPxx` in the code); everything else is wired.

| #                             | Capability                | Primitive                                                    | Files you edit                                                 | Check               |
| ----------------------------- | ------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- | ------------------- |
| [CP00](cp00-baseline.md)      | Run and chat              | Worker + Durable Object + Think + AI Gateway                 | none                                                           | manual              |
| [CP01](cp01-state.md)         | Validated shared settings | Agent state (`setState`, `validateStateChange`, `@callable`) | `src/agent/state.ts`, `src/agent/assistant.ts`                 | `npm run test:cp01` |
| [CP02](cp02-memory.md)        | Bounded memory            | Think context blocks                                         | `src/agent/session.ts`                                         | `npm run test:cp02` |
| [CP03](cp03-tools.md)         | Typed note tools          | AI SDK `tool()` + Zod + Durable Object SQLite                | `src/agent/tools/notes.ts`                                     | `npm run test:cp03` |
| [CP04](cp04-reminders.md)     | Durable reminders         | Agent `schedule()` + idempotent completion                   | `src/agent/tools/reminders.ts`, `src/agent/tasks/reminders.ts` | `npm run test:cp04` |
| [CP05](cp05-deploy-submit.md) | Deploy and submit         | `wrangler deploy` to `*.workers.dev`                         | `wrangler.jsonc` (gateway id)                                  | live URL works      |

CP02, CP03, and CP04 are independent of each other. If you get stuck on one,
move on and come back. Finished early? See [stretch goals](../stretch-goals.md).

## Working rules

- `npm test` passes before and after every exercise. `npm run test:cpXX` is red
  until that exercise is done, then green.
- Tests call your tools directly. That proves the tool works, separately from
  whether a model decides to call it.
- Commit after each checkpoint: `git add -A && git commit -m "cp01 done"`.

## If you are stuck

1. Open the **Hints** in the checkpoint guide, one at a time. Hint 4 has the full code.
2. Run the checkpoint test and read the first failure message.
3. Ask a presenter. Before anyone changes your code, commit or stash your work
   (`git stash` or `git commit -am wip`). Never run `git reset --hard`.
