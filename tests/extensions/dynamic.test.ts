import { runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
	DYNAMIC_LIMITS,
	DynamicToolError,
	NOTE_STATS_SOURCE,
	runIsolated,
} from "../../src/agent/extensions/dynamic";
import { runTool, uniqueName } from "../helpers";

// Runs only under the "extensions" environment, which provides a real Worker Loader.
const loader = (env as { LOADER?: WorkerLoader }).LOADER;
if (!loader)
	throw new Error("tests/extensions requires CLOUDFLARE_ENV=extensions (LOADER binding)");

const handler = (body: string) => `export default { async fetch(request) { ${body} } };`;

describe("Dynamic Workers: isolated tool execution", () => {
	it("runs the instructor fixture through a real loader and returns the expected JSON", async () => {
		const out = await runIsolated(loader, NOTE_STATS_SOURCE, {
			notes: [
				{ title: "a", bodyLength: 10, createdAt: "2026-11-01T10:00:00.000Z" },
				{ title: "longer", bodyLength: 30, createdAt: "2026-11-01T12:00:00.000Z" },
				{ title: "c", bodyLength: 20, createdAt: "2026-11-02T09:00:00.000Z" },
			],
		});
		expect(out).toEqual({
			count: 3,
			averageBodyLength: 20,
			notesPerDay: { "2026-11-01": 2, "2026-11-02": 1 },
			longestNoteTitle: "longer",
		});
	});

	it("uses the same executor from the agent's analyzeNotes tool", async () => {
		const stub = env.Assistant.getByName(uniqueName("dyn"));
		const result = await runInDurableObject(stub, async (agent) => {
			// Seed through the store so this does not depend on the CP03 exercise.
			agent.notes.save({ title: "One", body: "12345" }, "n1");
			agent.notes.save({ title: "Two", body: "1234567890" }, "n2");
			return runTool<{ isolated: boolean; stats: Record<string, unknown> }>(
				agent,
				"analyzeNotes",
				{},
				"a1",
			);
		});
		expect(result).toMatchObject({
			isolated: true,
			stats: { count: 2, averageBodyLength: 8, longestNoteTitle: "Two" },
		});
	});

	it("blocks outbound network access", async () => {
		const out = await runIsolated(
			loader,
			handler(`
				try { await fetch("https://example.com"); return Response.json({ fetched: true }); }
				catch (e) { return Response.json({ fetched: false }); }
			`),
			{},
		);
		expect(out).toEqual({ fetched: false });
	});

	it("exposes no parent bindings or secrets to the isolate", async () => {
		const out = await runIsolated(
			loader,
			`export default { async fetch(request, env) {
				return Response.json({ envKeys: Object.keys(env ?? {}), hasProcessEnv: typeof process !== "undefined" && Object.keys(process.env ?? {}).length > 0 });
			} };`,
			{},
		);
		expect(out).toEqual({ envKeys: [], hasProcessEnv: false });
	});

	it("turns a syntax error into a controlled tool error", async () => {
		await expect(runIsolated(loader, "export default {", {})).rejects.toBeInstanceOf(
			DynamicToolError,
		);
	});

	it("turns a thrown exception into a controlled tool error without leaking a stack", async () => {
		const error = await runIsolated(
			loader,
			handler(`throw new Error("boom\\nsecret stack");`),
			{},
		).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(DynamicToolError);
		expect(String((error as Error).message)).not.toContain("secret stack");
	});

	it("rejects oversized input before loading anything", async () => {
		const big = "x".repeat(DYNAMIC_LIMITS.inputBytes + 1);
		await expect(runIsolated(loader, NOTE_STATS_SOURCE, { big })).rejects.toThrow(
			/Input is too large/,
		);
	});

	it("rejects oversized output", async () => {
		await expect(
			runIsolated(
				loader,
				handler(`return new Response("x".repeat(${DYNAMIC_LIMITS.outputBytes + 1}));`),
				{},
			),
		).rejects.toThrow(/size limit/);
	});

	it("rejects malformed output", async () => {
		await expect(
			runIsolated(loader, handler(`return new Response("not json");`), {}),
		).rejects.toThrow(/invalid JSON/);
	});

	it("never reuses a cached isolate when the code changes", async () => {
		const a = await runIsolated(loader, handler(`return Response.json({ v: 1 });`), {});
		const b = await runIsolated(loader, handler(`return Response.json({ v: 2 });`), {});
		expect([a, b]).toEqual([{ v: 1 }, { v: 2 }]);
	});

	// Local workerd does not enforce cpuMs: an infinite loop hangs the local test
	// process (observed). Verify against a deployed extensions Worker instead.
	it.todo("stops runaway CPU with a controlled error (deployed only)");
});
