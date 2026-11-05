# Security notes

This is a learning starter, not a production-hardened product. These notes say
what it does and what it leaves to you.

## Authentication and authorization

- The app has **no login**. Anyone who can reach the URL can use any instance
  name and spend model credits.
- Protect deployments at the edge, for example with a Cloudflare Access
  application covering the Worker's hostname. That covers the page, the
  WebSocket upgrade, `/agents/*` RPC, and `/get-messages`.
- An instance name is an identifier, not a credential. Per-user isolation
  would mean deriving the instance name from a verified identity (for example
  the Access JWT) on the server, never from the client.
- Turning off the `workers.dev` route or putting Access on it matters: a second
  public hostname bypasses a policy that only covers a custom domain.

## Input validation

| Boundary          | Check                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| URL instance name | `InstanceNameSchema` in `server.ts`; 400 otherwise                            |
| State writes      | Client-originated `setState` rejected; every write parsed by `AppStateSchema` |
| RPC arguments     | Each `@callable` validates its argument with Zod                              |
| Tool input        | Zod schemas with length and range limits                                      |
| Model choice      | Allowlist in `contracts.ts`                                                   |

Configuration never injects free text into prompts: settings map to fixed,
server-owned strings.

## Model output

Rendered with `react-markdown` without `rehype-raw`, so HTML in model output is
shown as text, not executed. Links open with `rel="noopener noreferrer nofollow"`.

## Secrets and logging

- No provider keys: the `AI` binding authenticates to your account.
- `.dev.vars` is git-ignored. Never commit it.
- The app does not log prompts, memory, or tool payloads. AI Gateway may store
  request and response bodies depending on gateway settings; decide that
  deliberately.
- Memory is not a secret store and not authorization. The memory description
  tells the model not to store sensitive data; that is guidance, not
  enforcement.

## Resource limits

Tool steps per turn, memory tokens, note sizes, and reminder ranges are bounded
(see [architecture](architecture.md#limits)). There is no per-user rate limit;
use AI Gateway rate limiting or Access to control spend.

## Data

Synthetic data only. Remove a deployment with `npx wrangler delete`, then
confirm in the dashboard that its Durable Object data is gone.
