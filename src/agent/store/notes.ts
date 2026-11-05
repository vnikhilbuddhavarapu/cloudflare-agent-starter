import { LIMITS, type Note } from "../../shared/contracts";
import { iso, type Sql } from "./sql";

type Row = { id: string; title: string; body: string; created_at: number };

const toNote = (r: Row): Note => ({
	id: r.id,
	title: r.title,
	body: r.body,
	createdAt: iso(r.created_at),
});

/** Notes live in this agent instance's own SQLite database, so instances are isolated by construction. */
export class NotesStore {
	#ready = false;
	constructor(private readonly sql: Sql) {}

	#ensure() {
		if (this.#ready) return;
		this.sql`CREATE TABLE IF NOT EXISTS notes (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			operation_id TEXT UNIQUE
		)`;
		this.#ready = true;
	}

	/**
	 * Idempotent by operationId: a retried tool call with the same id returns
	 * the original note instead of inserting a duplicate.
	 */
	save(input: { title: string; body: string }, operationId: string, now = Date.now()) {
		this.#ensure();
		const [existing] = this.sql<Row>`SELECT * FROM notes WHERE operation_id = ${operationId}`;
		if (existing) return { note: toNote(existing), duplicate: true };
		const id = crypto.randomUUID();
		this.sql`INSERT INTO notes (id, title, body, created_at, operation_id)
			VALUES (${id}, ${input.title}, ${input.body}, ${now}, ${operationId})`;
		return { note: toNote({ id, ...input, created_at: now }), duplicate: false };
	}

	list(limit: number = LIMITS.notesListed): Note[] {
		this.#ensure();
		return this.sql<Row>`SELECT * FROM notes ORDER BY created_at DESC LIMIT ${limit}`.map(toNote);
	}
}
