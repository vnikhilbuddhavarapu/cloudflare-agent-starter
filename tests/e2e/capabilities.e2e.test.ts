import type { UIMessage } from "ai";
import { afterEach, describe, expect, it } from "vitest";
import type { AppState, MemoryView, Note, Reminder } from "../../src/shared/contracts";
import { chat, connect, textOf, waitFor } from "./client";

// Live: real model through AI Gateway. Model-driven checks (tool choice, memory
// writes) depend on the model deciding to act; deterministic coverage of the
// same capabilities lives in tests/integration.
type Client = Awaited<ReturnType<typeof connect>>;
const open: Client[] = [];
const conn = async (name: string) => {
	const c = await connect(name);
	open.push(c);
	return c;
};
afterEach(() => {
	for (const c of open.splice(0)) c.client.close();
});

const toolNames = (m: UIMessage | undefined) =>
	m?.parts.flatMap((p) => (p.type.startsWith("tool-") ? [p.type.slice(5)] : [])) ?? [];

describe("CP01 state sync (live)", () => {
	it("syncs a validated change to a second client and rejects direct client writes", async () => {
		const name = `e2e-state-${Date.now()}`;
		const a = await conn(name);
		const b = await conn(name);
		await a.client.call("setResponseStyle", ["detailed"]);
		await waitFor(() =>
			(b.client.state as AppState | undefined)?.responseStyle === "detailed" ? true : undefined,
		);

		a.client.setState({ ...(a.client.state as AppState), responseStyle: "concise" });
		await new Promise((r) => setTimeout(r, 1_000));
		const fresh = await conn(name);
		expect((fresh.client.state as AppState | undefined)?.responseStyle).toBe("detailed");

		await expect(a.client.call("setResponseStyle", ["verbose"])).rejects.toThrow();
	});
});

describe("CP02-CP04 model-driven capabilities (live)", () => {
	it("writes memory when asked to remember a preference", async () => {
		const name = `e2e-mem-${Date.now()}`;
		const a = await conn(name);
		await chat(a.client, "Please remember that my favourite colour is teal.");
		const memory = (await a.client.call("getMemory", [])) as MemoryView;
		expect(memory.content.toLowerCase()).toContain("teal");
	});

	it("saves a note through the saveNote tool", async () => {
		const name = `e2e-note-${Date.now()}`;
		const a = await conn(name);
		const { assistant } = await chat(
			a.client,
			'Save a note titled "Launch" with the body "Ship the starter on Friday".',
		);
		expect(toolNames(assistant)).toContain("saveNote");
		const notes = (await a.client.call("listNotes", [])) as Note[];
		expect(notes.map((n) => n.title)).toContain("Launch");
		expect(textOf(assistant).length).toBeGreaterThan(0);
	});

	it("completes a reminder while no client is connected", async () => {
		const name = `e2e-rem-${Date.now()}`;
		const a = await conn(name);
		const { assistant } = await chat(a.client, "Remind me to drink water in 10 seconds.");
		expect(toolNames(assistant)).toContain("scheduleReminder");
		a.client.close();
		open.length = 0;

		await new Promise((r) => setTimeout(r, 16_000));
		const b = await conn(name);
		const reminders = (await b.client.call("listReminders", [])) as Reminder[];
		expect(reminders[0]).toMatchObject({ status: "completed", completedAt: expect.any(String) });
	});
});
