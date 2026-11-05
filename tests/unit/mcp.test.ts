import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { MCP_SERVERS } from "../../src/agent/extensions/config";
import { allowedMcpTools, connectMcp } from "../../src/agent/extensions/mcp";

const host = (impl: () => Promise<{ state: string }>) => ({ addMcpServer: impl });

describe("MCP extension (allowlist and failure handling)", () => {
	it("is disabled when no server is configured, and the core config configures none", async () => {
		expect(
			await connectMcp(
				host(async () => ({ state: "ready" })),
				undefined,
			),
		).toEqual({
			state: "disabled",
		});
		expect((env as { MCP_SERVER?: string }).MCP_SERVER).toBeUndefined();
		expect((env as { LOADER?: unknown }).LOADER).toBeUndefined();
	});

	it("refuses servers outside the allowlist without attempting a connection", async () => {
		let called = false;
		const status = await connectMcp(
			host(async () => {
				called = true;
				return { state: "ready" };
			}),
			"https://evil.example/mcp",
		);
		expect(status).toMatchObject({
			state: "unavailable",
			reason: expect.stringMatching(/allowlist/),
		});
		expect(called).toBe(false);
	});

	it("connects to the allowlisted URL with a fixed id and exposes only allowlisted tools", async () => {
		const calls: unknown[] = [];
		const status = await connectMcp(
			{
				addMcpServer: async (...args: unknown[]) => {
					calls.push(args);
					return { state: "ready" };
				},
			},
			"cloudflare-docs",
		);
		expect(calls[0]).toEqual([
			"cloudflare-docs",
			MCP_SERVERS["cloudflare-docs"].url,
			{ id: "docs", transport: { type: "streamable-http" } },
		]);
		expect(status).toEqual({
			state: "connected",
			server: "cloudflare-docs",
			tools: ["tool_docs_search_cloudflare_documentation"],
		});
	});

	it("reports an unavailable server with an actionable message instead of throwing", async () => {
		const status = await connectMcp(
			host(async () => {
				throw new Error("getaddrinfo ENOTFOUND\n    at stack");
			}),
			"cloudflare-docs",
		);
		expect(status).toEqual({
			state: "unavailable",
			server: "cloudflare-docs",
			reason: "getaddrinfo ENOTFOUND",
		});
	});

	it("reports a server that needs authentication as unavailable", async () => {
		const status = await connectMcp(
			host(async () => ({ state: "authenticating" })),
			"cloudflare-docs",
		);
		expect(status).toMatchObject({ state: "unavailable", reason: "server state: authenticating" });
	});

	it("activates no MCP tools for an unknown or missing server", () => {
		expect(allowedMcpTools(undefined)).toEqual([]);
		expect(allowedMcpTools("other")).toEqual([]);
	});
});
