import { routeAgentRequest } from "agents";
import { InstanceNameSchema } from "./shared/contracts";

export { Assistant } from "./agent/assistant";

const AGENT_PATH = /^\/agents\/([^/]+)\/([^/]+)/;

// Authentication is enforced at the edge (Cloudflare Access). This boundary
// only rejects malformed instance names before they reach a Durable Object.
// A valid name is not an authorization grant.
export function validateAgentPath(url: URL): Response | null {
	const match = AGENT_PATH.exec(url.pathname);
	if (!match) return null;
	const parsed = InstanceNameSchema.safeParse(decodeURIComponent(match[2]));
	return parsed.success
		? null
		: Response.json(
				{ error: "invalid_instance", message: parsed.error.issues[0]?.message },
				{ status: 400 },
			);
}

export default {
	async fetch(request: Request, env: Env) {
		const rejected = validateAgentPath(new URL(request.url));
		if (rejected) return rejected;
		return (await routeAgentRequest(request, env)) ?? new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
