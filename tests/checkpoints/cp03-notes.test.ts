import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { SaveNoteInput } from "../../src/agent/tools/notes";
import { LIMITS, type Note } from "../../src/shared/contracts";
import { runTool as run, uniqueName } from "../helpers";

type Saved = { saved: boolean; duplicate: boolean; note: Note };
const runTool = run<Saved & { notes: Note[] }>;

describe("CP03 note input schema", () => {
	it("bounds title and body", () => {
		expect(SaveNoteInput.safeParse({ title: "t", body: "b" }).success).toBe(true);
		expect(SaveNoteInput.safeParse({ title: " ", body: "b" }).success).toBe(false);
		expect(
			SaveNoteInput.safeParse({ title: "x".repeat(LIMITS.noteTitle + 1), body: "b" }).success,
		).toBe(false);
		expect(
			SaveNoteInput.safeParse({ title: "t", body: "x".repeat(LIMITS.noteBody + 1) }).success,
		).toBe(false);
	});
});

// Exercises tool implementations directly: proves the tool works, independent
// of whether a model chooses to call it.
describe("CP03 typed note tools", () => {
	it("saves a note durably and returns a structured result", async () => {
		const stub = env.Assistant.getByName(uniqueName("notes"));
		const result = await runInDurableObject(stub, (agent) =>
			runTool(agent, "saveNote", { title: "Groceries", body: "Milk" }, "call-1"),
		);
		expect(result).toMatchObject({ saved: true, duplicate: false, note: { title: "Groceries" } });
		await evictDurableObject(stub);
		const notes = await runInDurableObject(stub, (agent) => agent.listNotes());
		expect(notes.map((n) => n.body)).toEqual(["Milk"]);
	});

	it("deduplicates a retried call with the same toolCallId", async () => {
		const stub = env.Assistant.getByName(uniqueName("notes"));
		const [first, second] = await runInDurableObject(stub, async (agent) => [
			await runTool(agent, "saveNote", { title: "A", body: "B" }, "same"),
			await runTool(agent, "saveNote", { title: "A", body: "B" }, "same"),
		]);
		expect(second).toMatchObject({ duplicate: true, note: { id: first.note.id } });
		expect(await runInDurableObject(stub, (agent) => agent.listNotes())).toHaveLength(1);
	});

	it("isolates notes between instances", async () => {
		const a = env.Assistant.getByName(uniqueName("notes-a"));
		const b = env.Assistant.getByName(uniqueName("notes-b"));
		await runInDurableObject(a, (agent) =>
			runTool(agent, "saveNote", { title: "secret", body: "a only" }, "x"),
		);
		expect(await runInDurableObject(b, (agent) => agent.listNotes())).toEqual([]);
	});

	it("lists notes through the listNotes tool", async () => {
		const stub = env.Assistant.getByName(uniqueName("notes"));
		const listed = await runInDurableObject(stub, async (agent) => {
			await runTool(agent, "saveNote", { title: "one", body: "1" }, "1");
			return runTool(agent, "listNotes", {}, "2");
		});
		expect(listed.notes).toHaveLength(1);
	});
});
