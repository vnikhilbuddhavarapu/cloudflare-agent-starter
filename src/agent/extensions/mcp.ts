import { isMcpServerKey, MCP_SERVERS, mcpToolName } from "./config";

export type McpStatus =
	| { state: "disabled" }
	| { state: "connected"; server: string; tools: string[] }
	| { state: "unavailable"; server: string; reason: string };

type McpHost = {
	addMcpServer(
		name: string,
		url: string,
		options: { id: string; transport: { type: "streamable-http" } },
	): Promise<{ state: string }>;
};

const CONNECT_TIMEOUT_MS = 8_000;

/**
 * Connect the configured, allowlisted MCP server as a client. The SDK persists
 * the connection and restores it after hibernation. Failure never blocks chat:
 * the tools are simply absent and the status explains why.
 */
export async function connectMcp(
	host: McpHost,
	configured: string | undefined,
): Promise<McpStatus> {
	if (!configured) return { state: "disabled" };
	if (!isMcpServerKey(configured)) {
		return {
			state: "unavailable",
			server: configured,
			reason: `"${configured}" is not in the MCP allowlist (src/agent/extensions/config.ts).`,
		};
	}
	const server = MCP_SERVERS[configured];
	try {
		// The race bounds how long a turn waits; it does not cancel the underlying connect.
		const result = await Promise.race([
			host.addMcpServer(configured, server.url, {
				id: server.id,
				transport: { type: "streamable-http" },
			}),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("connection timed out")), CONNECT_TIMEOUT_MS),
			),
		]);
		if (result.state !== "ready") {
			return { state: "unavailable", server: configured, reason: `server state: ${result.state}` };
		}
		return { state: "connected", server: configured, tools: allowedMcpTools(configured) };
	} catch (error) {
		const reason = error instanceof Error ? error.message.split("\n")[0] : "unknown error";
		return { state: "unavailable", server: configured, reason: reason ?? "unknown error" };
	}
}

/** Only these MCP tool names are ever activated for the model; the rest stay hidden. */
export function allowedMcpTools(configured: string | undefined): string[] {
	if (!isMcpServerKey(configured)) return [];
	const server = MCP_SERVERS[configured];
	return server.tools.map((t) => mcpToolName(server.id, t));
}
