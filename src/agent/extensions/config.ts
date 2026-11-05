/**
 * Optional capabilities. Both are off unless the "extensions" wrangler
 * environment provides their configuration; the core app never needs them.
 */
export type ExtensionEnv = {
	/** Worker Loader binding for Dynamic Workers. */
	LOADER?: WorkerLoader;
	/** Key into MCP_SERVERS. A key, not a URL, so no arbitrary endpoint can be configured. */
	MCP_SERVER?: string;
};

// Host-controlled allowlist: the server, its URL, and the only tools exposed to the model.
export const MCP_SERVERS = {
	"cloudflare-docs": {
		id: "docs",
		url: "https://docs.mcp.cloudflare.com/mcp",
		tools: ["search_cloudflare_documentation"],
	},
} as const;

export type McpServerKey = keyof typeof MCP_SERVERS;

export const isMcpServerKey = (value: unknown): value is McpServerKey =>
	typeof value === "string" && Object.hasOwn(MCP_SERVERS, value);

/** The tool name the Agents SDK gives an MCP tool: `tool_<serverId>_<toolName>`. */
export const mcpToolName = (serverId: string, tool: string) =>
	`tool_${serverId.replace(/-/g, "")}_${tool}`;
