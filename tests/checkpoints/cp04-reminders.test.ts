import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { Assistant } from "../../src/agent/assistant";
import { ScheduleReminderInput } from "../../src/agent/tools/reminders";
import { LIMITS, type Reminder } from "../../src/shared/contracts";
import { runTool, uniqueName } from "../helpers";

const scheduleReminder = (
	agent: Assistant,
	message: string,
	delaySeconds: number,
	callId: string,
) =>
	runTool<{ reminder: Reminder; duplicate: boolean }>(
		agent,
		"scheduleReminder",
		{ message, delaySeconds },
		callId,
	);

const reminderSchedules = async (agent: Assistant) =>
	(await agent.listSchedules()).filter((s) => s.callback === "onReminderDue");

describe("CP04 reminder input schema", () => {
	it.each([
		[LIMITS.reminderMinSeconds, true],
		[LIMITS.reminderMaxSeconds, true],
		[LIMITS.reminderMinSeconds - 1, false],
		[LIMITS.reminderMaxSeconds + 1, false],
		[-60, false],
		[30.5, false],
	])("delaySeconds=%d valid=%s", (delaySeconds, valid) => {
		expect(ScheduleReminderInput.safeParse({ message: "m", delaySeconds }).success).toBe(valid);
	});
});

describe("CP04 durable scheduled reminders", () => {
	it("registers a durable SDK schedule and a pending record that survive eviction", async () => {
		const stub = env.Assistant.getByName(uniqueName("rem"));
		const { reminder } = await runInDurableObject(stub, (agent) =>
			scheduleReminder(agent, "Stretch", 60, "r1"),
		);
		expect(reminder.status).toBe("pending");
		expect(Date.parse(reminder.dueAt) - Date.now()).toBeGreaterThan(55_000);

		await evictDurableObject(stub);
		const [schedules, reminders] = await runInDurableObject(stub, async (agent) => [
			await reminderSchedules(agent),
			agent.listReminders(),
		]);
		expect(schedules).toEqual([expect.objectContaining({ payload: { reminderId: reminder.id } })]);
		expect(reminders[0]?.status).toBe("pending");
	});

	it("completes once and ignores duplicate delivery", async () => {
		const stub = env.Assistant.getByName(uniqueName("rem"));
		const result = await runInDurableObject(stub, async (agent) => {
			const { reminder } = await scheduleReminder(agent, "Water", 30, "r2");
			await agent.onReminderDue({ reminderId: reminder.id });
			const firstCompletedAt = agent.listReminders()[0]?.completedAt;
			await agent.onReminderDue({ reminderId: reminder.id });
			return { list: agent.listReminders(), firstCompletedAt };
		});
		expect(result.list[0]?.status).toBe("completed");
		expect(result.list[0]?.completedAt).toBe(result.firstCompletedAt);
	});

	it("records completion with no connected client and posts a transcript notice", async () => {
		const stub = env.Assistant.getByName(uniqueName("rem"));
		const messages = await runInDurableObject(stub, async (agent) => {
			const { reminder } = await scheduleReminder(agent, "Call back", 30, "r3");
			await agent.onReminderDue({ reminderId: reminder.id });
			return agent.getMessages();
		});
		expect(JSON.stringify(messages)).toContain("Reminder: Call back");
	});

	it("deduplicates a retried scheduling call", async () => {
		const stub = env.Assistant.getByName(uniqueName("rem"));
		const [a, b, schedules] = await runInDurableObject(stub, async (agent) => [
			await scheduleReminder(agent, "Once", 30, "same"),
			await scheduleReminder(agent, "Once", 30, "same"),
			await reminderSchedules(agent),
		]);
		expect(b).toMatchObject({ duplicate: true, reminder: { id: a.reminder.id } });
		expect(schedules).toHaveLength(1);
	});

	it("cancels a pending reminder and its schedule", async () => {
		const stub = env.Assistant.getByName(uniqueName("rem"));
		const [cancelled, list, schedules] = await runInDurableObject(stub, async (agent) => {
			const { reminder } = await scheduleReminder(agent, "Cancel me", 60, "r4");
			return [
				await agent.cancelReminder(reminder.id),
				agent.listReminders(),
				await reminderSchedules(agent),
			];
		});
		expect(cancelled).toBe(true);
		expect(list[0]?.status).toBe("cancelled");
		expect(schedules).toHaveLength(0);
	});

	it("ignores a callback for a cancelled reminder", async () => {
		const stub = env.Assistant.getByName(uniqueName("rem"));
		const list = await runInDurableObject(stub, async (agent) => {
			const { reminder } = await scheduleReminder(agent, "Late", 30, "r5");
			await agent.cancelReminder(reminder.id);
			await agent.onReminderDue({ reminderId: reminder.id });
			return agent.listReminders();
		});
		expect(list[0]?.status).toBe("cancelled");
	});
});
