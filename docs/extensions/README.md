# Extension paths

None of these are needed for the core lab. Each lists what it adds, what
it needs, and where it would plug in. Verify current APIs against the docs and
the installed types before building.

| Extension                             | What it adds                                          | Needs                                              | Plugs in at                                                      |
| ------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| [Read-only MCP](mcp.md)               | Tools from an allowlisted MCP server                  | A host-controlled MCP endpoint                     | `assistant.ts` (`addMcpServer`)                                  |
| [Dynamic Workers](dynamic-workers.md) | Run tool code in an isolated Worker loaded at runtime | Worker Loader binding and entitlement              | a new tool + `wrangler.jsonc`                                    |
| Sub-agents                            | Delegate work to child agents with their own state    | Agents SDK sub-agent APIs                          | new agent class + RPC                                            |
| Durable execution                     | Long multi-step work that survives restarts           | Agents SDK tasks/workflows or Cloudflare Workflows | `tasks/`                                                         |
| Programmatic turns                    | A scheduled callback that asks the model to act       | Think programmatic-turn API                        | `onReminderDue` (never start a blocking turn from inside a tool) |
| Browser tools                         | Let the agent browse                                  | Browser Rendering binding                          | new tool                                                         |
| Email                                 | Send or receive email                                 | Email Service binding, verified domain             | new tool / handler                                               |
| Voice                                 | Speech in and out                                     | Agents SDK voice APIs                              | client + agent                                                   |
| Runtime Agent Skills                  | Procedures the agent loads on demand                  | Workspace or R2 source                             | `getSkills()`                                                    |
| R2 artifacts                          | Store files the agent produces                        | R2 bucket binding                                  | new store + tool                                                 |
| Sandboxed Linux                       | Run real commands                                     | Sandbox SDK (Containers)                           | new tool                                                         |

Add a service only when a capability needs it. Durable Object SQLite already
covers history, state, memory, and records.
