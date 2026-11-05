import { runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { MEMORY_LABEL } from "../../src/agent/session";
import { LIMITS } from "../../src/shared/contracts";
import { contextOf, restart, startedAgent } from "../helpers";

// Deterministic: verifies storage and context assembly without depending on model wording.
describe("CP02 bounded writable memory", () => {
	it("declares a writable memory block with a token budget and a read-only soul", async () => {
		const stub = await startedAgent("mem");
		const blocks = await runInDurableObject(stub, (agent) => contextOf(agent).getBlocks());
		expect(blocks.find((b) => b.label === MEMORY_LABEL)).toMatchObject({
			writable: true,
			maxTokens: LIMITS.memoryTokens,
		});
		expect(blocks.find((b) => b.label === "soul")).toMatchObject({ writable: false });
	});

	it("persists memory across a restart and exposes it through getMemory", async () => {
		const stub = await startedAgent("mem");
		await runInDurableObject(stub, (agent) =>
			contextOf(agent).setBlock(MEMORY_LABEL, "Prefers metric units."),
		);
		await restart(stub);
		const view = await runInDurableObject(stub, (agent) => agent.getMemory());
		expect(view).toEqual({
			content: "Prefers metric units.",
			tokens: expect.any(Number),
			maxTokens: LIMITS.memoryTokens,
		});
	});

	it("puts updated memory into the next turn's model context", async () => {
		const stub = await startedAgent("mem");
		const reminder = await runInDurableObject(stub, async (agent) => {
			const ctx = contextOf(agent);
			await ctx.freezeSystemPrompt();
			await ctx.setBlock(MEMORY_LABEL, "Favourite language: TypeScript.");
			// Think appends this to the next turn's messages for whenChanged: "remind" blocks.
			return ctx.reminder();
		});
		expect(reminder).toContain("Favourite language: TypeScript.");
	});

	it("rejects memory writes over the token budget", async () => {
		const stub = await startedAgent("mem");
		await expect(
			runInDurableObject(stub, (agent) =>
				contextOf(agent).setBlock(MEMORY_LABEL, "word ".repeat(LIMITS.memoryTokens * 4)),
			),
		).rejects.toThrow();
	});

	it("clears memory", async () => {
		const stub = await startedAgent("mem");
		const view = await runInDurableObject(stub, async (agent) => {
			await contextOf(agent).setBlock(MEMORY_LABEL, "temp");
			await agent.clearMemory();
			return agent.getMemory();
		});
		expect(view.content).toBe("");
	});
});
