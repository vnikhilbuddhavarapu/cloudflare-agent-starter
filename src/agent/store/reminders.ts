import type { Reminder } from "../../shared/contracts";
import { iso, type Sql } from "./sql";

type Row = {
	id: string;
	message: string;
	due_at: number;
	status: Reminder["status"];
	schedule_id: string;
	completed_at: number | null;
};

const toReminder = (r: Row): Reminder => ({
	id: r.id,
	message: r.message,
	dueAt: iso(r.due_at),
	status: r.status,
	completedAt: r.completed_at === null ? null : iso(r.completed_at),
});

/** Application records for reminders. The SDK schedule row only says when to call back. */
export class RemindersStore {
	#ready = false;
	constructor(private readonly sql: Sql) {}

	#ensure() {
		if (this.#ready) return;
		this.sql`CREATE TABLE IF NOT EXISTS reminders (
			id TEXT PRIMARY KEY,
			message TEXT NOT NULL,
			due_at INTEGER NOT NULL,
			status TEXT NOT NULL,
			schedule_id TEXT NOT NULL,
			completed_at INTEGER,
			operation_id TEXT UNIQUE
		)`;
		this.#ready = true;
	}

	findByOperation(operationId: string): Reminder | null {
		this.#ensure();
		const [row] = this.sql<Row>`SELECT * FROM reminders WHERE operation_id = ${operationId}`;
		return row ? toReminder(row) : null;
	}

	insert(
		r: { id: string; message: string; dueAt: number; scheduleId: string },
		operationId: string,
	) {
		this.#ensure();
		this.sql`INSERT INTO reminders (id, message, due_at, status, schedule_id, operation_id)
			VALUES (${r.id}, ${r.message}, ${r.dueAt}, 'pending', ${r.scheduleId}, ${operationId})`;
		return toReminder({
			id: r.id,
			message: r.message,
			due_at: r.dueAt,
			status: "pending",
			schedule_id: r.scheduleId,
			completed_at: null,
		});
	}

	/** Transitions pending -> completed exactly once; duplicate deliveries return null. */
	complete(id: string, now = Date.now()): Reminder | null {
		this.#ensure();
		const [row] = this.sql<Row>`UPDATE reminders SET status = 'completed', completed_at = ${now}
			WHERE id = ${id} AND status = 'pending' RETURNING *`;
		return row ? toReminder(row) : null;
	}

	/** Returns the schedule id to cancel, or null if the reminder is not pending. */
	cancel(id: string): string | null {
		this.#ensure();
		const [row] = this.sql<Row>`UPDATE reminders SET status = 'cancelled'
			WHERE id = ${id} AND status = 'pending' RETURNING *`;
		return row ? row.schedule_id : null;
	}

	list(): Reminder[] {
		this.#ensure();
		return this.sql<Row>`SELECT * FROM reminders ORDER BY due_at DESC LIMIT 50`.map(toReminder);
	}
}
