# CP04: Durable reminders

**Goal:** schedule reminders that complete even when every browser tab is
closed. (12 min)

## The primitive

`this.schedule(when, "methodName", payload)` stores a schedule row in the
Durable Object's SQLite and sets an alarm. When it is due, the platform wakes
the Durable Object and calls `methodName(payload)`, with or without connected
clients. A number for `when` means a delay in **seconds**, not milliseconds.

Durable registration is not exactly-once delivery. A callback can run more than
once, so completion must be idempotent: the store only moves a reminder from
`pending` to `completed` once, and later deliveries are ignored.

Order matters:

- Register the schedule **before** writing the reminder record. If the process
  dies in between, the callback finds no record and does nothing, instead of
  leaving a reminder that never fires.
- Persist completion **before** notifying clients, so a user who reconnects
  later still sees it. `onReminderDue` in `assistant.ts` already does this and
  posts a "Reminder: ..." message into the chat.

Times are stored in UTC and shown in the browser's time zone.

## Your task

In `src/agent/tools/reminders.ts`:

1. Bound `ScheduleReminderInput`: message 1 to `LIMITS.reminderMessage` chars;
   `delaySeconds` an integer between `LIMITS.reminderMinSeconds` and
   `LIMITS.reminderMaxSeconds`.
2. Return `scheduleReminder` and `listReminders` tools. `scheduleReminder`
   returns `{ scheduled: true, reminder, duplicate }`, deduplicates by
   `toolCallId`, and follows the ordering rules above. `listReminders` returns
   `{ reminders }`.

In `src/agent/tasks/reminders.ts`:

3. `completeDueReminder`: complete the reminder through the store.

## Verify

```sh
npm run test:cp04
```

Manual:

1. Say "Remind me to stretch in 20 seconds." A **Schedule reminder** card appears.
2. Inspector, **Reminders** tab: pending, counting down.
3. Close every tab for this app. Wait 30 seconds.
4. Reopen. The reminder is **completed** and the chat shows "Reminder: stretch".
5. Schedule another and cancel it with the X. It never fires.

## Common failures

| Symptom                       | Cause                                                     |
| ----------------------------- | --------------------------------------------------------- |
| Reminder fires ~1000x late    | Passed milliseconds; `schedule` takes seconds             |
| Stays pending forever         | `completeDueReminder` still returns `null`                |
| "Too small" validation error  | Model chose under 10 seconds; the schema is doing its job |
| Two schedules for one request | No `findByOperation(toolCallId)` check before scheduling  |

## Hints

<details><summary>Hint 1: the idea</summary>

The tool registers a durable callback and writes a record. The callback marks
the record done. The browser is never involved in either step.
</details>

<details><summary>Hint 2: the APIs</summary>

- `z.number().int().min(a).max(b)`
- `schedule(delaySeconds, reminderId)` (passed in) returns the schedule id.
- `reminders.findByOperation(id)`, `reminders.insert(record, operationId)`, `reminders.complete(id, now)`.
</details>

<details><summary>Hint 3: the shape</summary>

```ts
execute: async ({ message, delaySeconds }, { toolCallId }) => {
	const existing = /* ... */;
	if (existing) return { scheduled: true, reminder: existing, duplicate: true };
	const id = crypto.randomUUID();
	const scheduleId = await schedule(/* ... */);
	const reminder = reminders.insert(/* ... */);
	onChange();
	return { scheduled: true, reminder, duplicate: false };
},
```
</details>

<details><summary>Hint 4: full code</summary>

`src/agent/tools/reminders.ts`: add these imports:

```ts
import { tool } from "ai";
import { LIMITS } from "../../shared/contracts";
```

Then:

```ts
export const ScheduleReminderInput = z.object({
	message: z
		.string()
		.trim()
		.min(1)
		.max(LIMITS.reminderMessage)
		.describe("What to remind the user about"),
	delaySeconds: z
		.number()
		.int()
		.min(LIMITS.reminderMinSeconds)
		.max(LIMITS.reminderMaxSeconds)
		.describe("Delay from now in whole seconds (10 to 604800)"),
});

export function reminderTools(
	reminders: RemindersStore,
	schedule: ReminderScheduler,
	onChange: () => void,
	now: () => number = Date.now,
) {
	return {
		scheduleReminder: tool({
			description:
				"Schedule a reminder that fires after a delay, even if the user closes the browser. Convert user times to a delay in seconds.",
			inputSchema: ScheduleReminderInput,
			execute: async ({ message, delaySeconds }, { toolCallId }) => {
				const existing = reminders.findByOperation(toolCallId);
				if (existing) return { scheduled: true as const, reminder: existing, duplicate: true };
				const id = crypto.randomUUID();
				const scheduleId = await schedule(delaySeconds, id);
				const reminder = reminders.insert(
					{ id, message, dueAt: now() + delaySeconds * 1000, scheduleId },
					toolCallId,
				);
				onChange();
				return { scheduled: true as const, reminder, duplicate: false };
			},
		}),
		listReminders: tool({
			description: "List reminders with their status (pending, completed, cancelled).",
			inputSchema: z.object({}),
			execute: async () => ({ reminders: reminders.list() }),
		}),
	};
}
```

`src/agent/tasks/reminders.ts`:

```ts
export function completeDueReminder(
	reminders: RemindersStore,
	payload: ReminderDuePayload,
	now = Date.now(),
): Reminder | null {
	return reminders.complete(payload.reminderId, now);
}
```
</details>
