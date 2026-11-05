import { runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { uniqueName } from "../helpers";

// Baseline behaviour that works before any checkpoint exercise.
describe("baseline state", () => {
	it("starts from the initial state", async () => {
		const stub = env.Assistant.getByName(uniqueName("base"));
		const state = await runInDurableObject(stub, (agent) => agent.state);
		expect(state).toEqual({ model: expect.any(String), responseStyle: "concise" });
	});

	it("validates model selection against the allowlist", async () => {
		const stub = env.Assistant.getByName(uniqueName("model"));
		await runInDurableObject(stub, (agent) => agent.setModel("@cf/qwen/qwen3.8-27b"));
		expect((await runInDurableObject(stub, (agent) => agent.state)).model).toBe(
			"@cf/qwen/qwen3.8-27b",
		);
		await expect(
			runInDurableObject(stub, (agent) => agent.setModel("@cf/evil/model")),
		).rejects.toThrow();
	});

	it("exposes empty records for a fresh instance", async () => {
		const stub = env.Assistant.getByName(uniqueName("records"));
		const [notes, reminders] = await runInDurableObject(stub, (agent) => [
			agent.listNotes(),
			agent.listReminders(),
		]);
		expect(notes).toEqual([]);
		expect(reminders).toEqual([]);
	});
});
