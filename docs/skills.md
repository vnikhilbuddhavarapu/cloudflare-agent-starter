# Cloudflare skills for your coding assistant

Two different things share the word "skills". Do not confuse them.

|                 | Development skills                                                           | Runtime Agent Skills                                                |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Who uses them   | Your coding assistant (OpenCode, Claude Code, Cursor, Codex, Copilot, Devin) | The deployed Think agent itself                                     |
| Purpose         | Up-to-date guidance for building on Cloudflare                               | On-demand procedures and references for the agent's users           |
| Installed where | Your machine or editor                                                       | Loaded by the agent from a Workspace, R2, or code via `getSkills()` |
| In this repo    | Not installed by default                                                     | Not enabled                                                         |

## Install development skills

Source: https://github.com/cloudflare/skills (Apache-2.0). Review the skill
files before installing; skills are guidance, not a permissions boundary.

Pick the method for your assistant (from the upstream README):

| Assistant                                             | Install                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Any assistant that supports the Agent Skills standard | `npx skills add https://github.com/cloudflare/skills`                                           |
| Claude Code                                           | `/plugin marketplace add cloudflare/skills` then `/plugin install cloudflare@cloudflare`        |
| Codex                                                 | `codex plugin marketplace add cloudflare/skills` then `codex plugin add cloudflare@cloudflare`  |
| VS Code / Copilot                                     | Enable `chat.plugins.enabled`, then **Chat: Install Plugin From Source** with the repo URL      |
| Cursor                                                | Marketplace, or **Settings > Rules > Add Rule > Remote Rule (GitHub)** with `cloudflare/skills` |
| OpenCode (manual)                                     | Copy skill folders into `~/.config/opencode/skills/`                                            |

The plugin installs also add Cloudflare's remote MCP server. The `npx skills`
and manual methods install only the skills.

Useful skills for this repo: `agents-sdk`, `durable-objects`,
`workers-best-practices`, `wrangler`.

### Confirm it loaded

Ask your assistant: "Which Cloudflare skills do you have loaded?" or start a
task that matches one (for example "add a scheduled callback to my Agents SDK
agent") and check that it cites current docs rather than guessing an API.

### A bounded exercise

> In `src/agent/tools/notes.ts`, reject note titles that are only punctuation.
> Add a test in `tests/checkpoints/cp03-notes.test.ts`. Run `npm run test:cp03`.

Review the diff before accepting it. Run the tests yourself.

## Runtime Agent Skills (extension)

Think can load [Agent Skills](https://developers.cloudflare.com/agents/skills/)
for the deployed agent with `getSkills()`, from a `@cloudflare/computer`
Workspace, an R2 bucket, or a code manifest. The model sees a catalog and loads
a skill only when a task matches it.

This repo does not enable runtime skills. The current docs describe Agents SDK
0.32 / Think 0.23; this repo pins earlier versions, so check the installed
types before trying it.
