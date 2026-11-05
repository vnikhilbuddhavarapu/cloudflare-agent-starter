import { runInDurableObject } from "cloudflare:test";
import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("routing", () => {
	it("rejects malformed instance names before reaching a Durable Object", async () => {
		const res = await exports.default.fetch("http://example.com/agents/assistant/Bad_Name!");
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: "invalid_instance" });
	});

	it("does not route unknown paths", async () => {
		const res = await exports.default.fetch("http://example.com/api/unknown");
		expect(res.status).toBe(404);
	});

	it("addresses distinct named instances", async () => {
		const a = env.Assistant.getByName("alpha");
		const b = env.Assistant.getByName("beta");
		expect(a.id.equals(b.id)).toBe(false);
		expect(await runInDurableObject(a, (agent) => agent.name)).toBe("alpha");
		expect(await runInDurableObject(b, (agent) => agent.name)).toBe("beta");
	});
});
