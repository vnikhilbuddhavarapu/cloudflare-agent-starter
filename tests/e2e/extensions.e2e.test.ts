import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import type { CapabilitiesView } from "../../src/agent/assistant";
import type { Note } from "../../src/shared/contracts";
import { chat, connect } from "./client";

// Live, optional: run against `npm run dev:extensions` (or a deployed extensions Worker)
// with E2E_EXTENSIONS=1. Real MCP server, real Worker Loader, real model.
const enabled = process.env.E2E_EXTENSIONS === "1";

const toolParts = (m: UIMessage | undefined) =>
	(m?.parts ?? []).filter((p) => p.type.startsWith("tool-")) as Array<{
		type: string;
		state: string;
		output?: unknown;
	}>;

describe.runIf(enabled)("optional extensions (live)", () => {
	it("reports a real MCP connection and the Worker Loader", async () => {
		const a = await connect(`e2e-ext-${Date.now()}`);
		const caps = (await a.client.call("getCapabilities", [])) as CapabilitiesView;
		expect(caps.dynamicWorkers).toBe(true);
		expect(caps.mcp).toEqual({
			state: "connected",
			server: "cloudflare-docs",
			tools: ["tool_docs_search_cloudflare_documentation"],
		});
		a.client.close();
	});

	it("executes the allowlisted read-only MCP tool through the model", async () => {
		const a = await connect(`e2e-mcp-${Date.now()}`);
		const { assistant } = await chat(
			a.client,
			"Use the Cloudflare documentation search tool to find what a Durable Object alarm is. Answer in one sentence.",
		);
		const mcp = toolParts(assistant).find(
			(p) => p.type === "tool-tool_docs_search_cloudflare_documentation",
		);
		expect(mcp?.state).toBe("output-available");
		// Non-allowlisted MCP tools are never activated.
		expect(toolParts(assistant).some((p) => p.type.includes("migrate_pages"))).toBe(false);
		a.client.close();
	});

	it("runs analyzeNotes in a Dynamic Worker through the model", async () => {
		const a = await connect(`e2e-dyn-${Date.now()}`);
		await chat(a.client, 'Save a note titled "Alpha" with body "first note body".');
		const notes = (await a.client.call("listNotes", [])) as Note[];
		expect(notes.length).toBeGreaterThan(0);
		const { assistant } = await chat(a.client, "Analyze my notes with the analyzeNotes tool.");
		const part = toolParts(assistant).find((p) => p.type === "tool-analyzeNotes");
		expect(part?.state).toBe("output-available");
		expect(part?.output).toMatchObject({ isolated: true, stats: { count: notes.length } });
		a.client.close();
	});
});
