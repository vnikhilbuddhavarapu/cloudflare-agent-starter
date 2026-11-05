# Extension: read-only MCP client

**Off by default.** The core app never connects to an MCP server.

## What it does

The agent connects as an **MCP client** to one allowlisted server and exposes
one read-only tool to the model. This app is not an MCP server.

| Setting      | Value                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Server       | Cloudflare documentation MCP (`https://docs.mcp.cloudflare.com/mcp`)            |
| Tool exposed | `search_cloudflare_documentation` (read-only, public docs, no credentials)      |
| Tools hidden | Every other tool the server lists, for example `migrate_pages_to_workers_guide` |

## How it is controlled

- `src/agent/extensions/config.ts` holds the allowlist: server key, URL, and the
  exact tool names allowed. The configuration value (`MCP_SERVER`) is a **key**
  into that list, never a URL, so no arbitrary endpoint can be configured.
- `connectMcp()` calls `this.addMcpServer()` with a fixed id (`docs`), so the
  SDK names the tool `tool_docs_search_cloudflare_documentation`.
- `beforeTurn` activates only allowlisted MCP tool names. Other MCP tools stay
  connected but invisible to the model.
- `waitForMcpConnections` is set (8 s) only when MCP is configured, because
  Think assembles tools before `beforeTurn` runs.
- An unknown key, a connection error, a timeout, or a server that requires
  OAuth produces `{ state: "unavailable", reason }`. Chat keeps working; the
  inspector shows the reason. Nothing is ever fabricated.
- The SDK persists the connection in the Durable Object and restores it after
  hibernation.

## Run it

```sh
npm run dev:extensions        # CLOUDFLARE_ENV=extensions
```

Ask: "Use the Cloudflare documentation search tool to find what a Durable
Object alarm is." An **MCP** tool card appears. The inspector's instance card
shows `MCP: cloudflare-docs · 1 tool`.

## Tests

| Test                                                                                                       | Command                                                                                          | Needs                  |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| Allowlist, unknown server refused without connecting, timeout/error/OAuth handling, core has no MCP config | `npm test` (`tests/unit/mcp.test.ts`)                                                            | nothing                |
| Real connection, tool discovery, model executes the allowlisted tool, hidden tool never runs               | `E2E_EXTENSIONS=1 npm run test:e2e -- tests/e2e/extensions.e2e.test.ts` against `dev:extensions` | network, model credits |

## Adding a server

Add an entry to `MCP_SERVERS` with a fixed id and the smallest tool list. For a
server that needs credentials, pass headers through `transport.headers` from a
Worker secret; never accept a token from the client, and never expose write
tools without an authorization check in host code.
