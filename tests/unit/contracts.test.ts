import { describe, expect, it } from "vitest";
import { InstanceNameSchema, MODELS, ModelIdSchema } from "../../src/shared/contracts";

describe("instance names", () => {
	it.each(["default", "team-a", "a1"])("accepts %s", (name) => {
		expect(InstanceNameSchema.safeParse(name).success).toBe(true);
	});
	it.each(["", "Upper", "has space", "-lead", "a".repeat(49), "../etc"])("rejects %j", (name) => {
		expect(InstanceNameSchema.safeParse(name).success).toBe(false);
	});
});

describe("model allowlist", () => {
	it("accepts every listed model and nothing else", () => {
		for (const m of MODELS) expect(ModelIdSchema.safeParse(m.id).success).toBe(true);
		expect(ModelIdSchema.safeParse("@cf/unknown/model").success).toBe(false);
	});
});
