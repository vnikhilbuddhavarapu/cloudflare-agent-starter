import { afterEach, describe, expect, it } from "vitest";
import { chat, connect, getMessages, textOf, waitFor } from "./client";

// Live: calls a real model through AI Gateway and consumes credits.
describe("baseline (live)", () => {
	const instance = `e2e-${Date.now()}`;
	const open: { client: { close(): void } }[] = [];
	afterEach(() => {
		for (const c of open.splice(0)) c.client.close();
	});

	it("streams a reply and broadcasts it to a second client on the same instance", async () => {
		const a = await connect(instance);
		const b = await connect(instance);
		open.push(a, b);
		const { assistant, updates } = await chat(a.client, "Reply with exactly the word: pineapple");
		expect(textOf(assistant).toLowerCase()).toContain("pineapple");
		// More than one incremental update means the reply was streamed, not delivered whole.
		expect(updates).toBeGreaterThan(1);
		const synced = await waitFor(() => {
			const m = b.broadcast();
			return m && m.length >= 2 ? m : undefined;
		});
		expect(textOf(synced.at(-1)).toLowerCase()).toContain("pineapple");
	});

	it("persists the transcript after every client disconnects", async () => {
		const history = await getMessages(instance);
		expect(history.map((m) => m.role)).toEqual(["user", "assistant"]);
		expect(textOf(history[1]).toLowerCase()).toContain("pineapple");
	});

	it("does not expose one instance's transcript to another", async () => {
		expect(await getMessages(`${instance}-other`)).toEqual([]);
	});
});
