import { tool } from "ai";
import { z } from "zod";
import type { NotesStore } from "../store/notes";

/**
 * Runs instructor-provided JavaScript in a Dynamic Worker: a separate isolate
 * with no network, no bindings, and CPU and subrequest limits. The host stays
 * authoritative: it chooses the code, bounds the input, validates the output,
 * and keeps all durable state.
 */

export const DYNAMIC_LIMITS = {
	cpuMs: 50,
	subRequests: 0,
	inputBytes: 32 * 1024,
	outputBytes: 8 * 1024,
	// Response deadline for the host. It stops waiting; it does not kill the
	// isolate. cpuMs is what actually terminates runaway execution.
	responseMs: 5_000,
} as const;

// Matches the host Worker's compatibility_date so behaviour is identical.
const COMPATIBILITY_DATE = "2026-10-19";

export class DynamicToolError extends Error {
	override name = "DynamicToolError";
}

/** Load a module in an isolated Worker and POST bounded JSON to it. */
export async function runIsolated(
	loader: WorkerLoader,
	source: string,
	input: unknown,
): Promise<unknown> {
	const body = JSON.stringify(input);
	if (new TextEncoder().encode(body).byteLength > DYNAMIC_LIMITS.inputBytes) {
		throw new DynamicToolError("Input is too large for the isolated tool.");
	}
	const code: WorkerLoaderWorkerCode = {
		compatibilityDate: COMPATIBILITY_DATE,
		mainModule: "tool.js",
		modules: { "tool.js": source },
		// null blocks fetch() and connect(). Omitting it would inherit the host's network.
		globalOutbound: null,
		// Deliberately empty: no bindings, secrets, storage, or model access.
		env: {},
		limits: { cpuMs: DYNAMIC_LIMITS.cpuMs, subRequests: DYNAMIC_LIMITS.subRequests },
	};
	// The id must change whenever code or configuration changes, or a warm isolate
	// running old code could be reused.
	const id = `dyn:${await sha256(JSON.stringify({ source, code: { ...code, modules: undefined } }))}`;
	const worker = loader.get(id, () => code);

	let response: Response;
	try {
		response = await worker.getEntrypoint().fetch("http://isolated/run", {
			method: "POST",
			body,
			headers: { "content-type": "application/json" },
			signal: AbortSignal.timeout(DYNAMIC_LIMITS.responseMs),
		});
	} catch (error) {
		throw new DynamicToolError(`Isolated tool failed: ${describe(error)}`);
	}
	if (!response.ok) throw new DynamicToolError(`Isolated tool returned HTTP ${response.status}.`);
	const text = await readBounded(response, DYNAMIC_LIMITS.outputBytes);
	try {
		return JSON.parse(text);
	} catch {
		throw new DynamicToolError("Isolated tool returned invalid JSON.");
	}
}

async function readBounded(response: Response, maxBytes: number): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) return "";
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new DynamicToolError("Isolated tool output exceeded the size limit.");
		}
		chunks.push(value);
	}
	return new TextDecoder().decode(concat(chunks, total));
}

function concat(chunks: Uint8Array[], total: number) {
	const out = new Uint8Array(total);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.byteLength;
	}
	return out;
}

async function sha256(text: string) {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Never surface stack traces or internals to the model or user.
const describe = (error: unknown) =>
	error instanceof Error ? error.message.split("\n")[0]?.slice(0, 200) : "unknown error";

// Instructor-provided transformation. Plain JavaScript: the loader does not compile TypeScript.
export const NOTE_STATS_SOURCE = `
export default {
	async fetch(request) {
		const { notes } = await request.json();
		const byDay = {};
		let totalBody = 0;
		let longest = null;
		for (const n of notes) {
			const day = n.createdAt.slice(0, 10);
			byDay[day] = (byDay[day] ?? 0) + 1;
			totalBody += n.bodyLength;
			if (!longest || n.bodyLength > longest.bodyLength) longest = n;
		}
		return Response.json({
			count: notes.length,
			averageBodyLength: notes.length ? Math.round(totalBody / notes.length) : 0,
			notesPerDay: byDay,
			longestNoteTitle: longest ? longest.title : null,
		});
	},
};
`;

export const NoteStatsSchema = z
	.object({
		count: z.number().int().nonnegative(),
		averageBodyLength: z.number().nonnegative(),
		notesPerDay: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.number().int().nonnegative()),
		longestNoteTitle: z.string().max(200).nullable(),
	})
	.strict();

export function dynamicTools(loader: WorkerLoader, notes: NotesStore) {
	return {
		analyzeNotes: tool({
			description:
				"Compute statistics about the user's saved notes (count, average length, notes per day) in an isolated sandbox.",
			inputSchema: z.object({}),
			execute: async () => {
				// Pass metadata only; note bodies never leave the host.
				const input = {
					notes: notes.list().map((n) => ({
						title: n.title,
						bodyLength: n.body.length,
						createdAt: n.createdAt,
					})),
				};
				const parsed = NoteStatsSchema.safeParse(
					await runIsolated(loader, NOTE_STATS_SOURCE, input),
				);
				if (!parsed.success)
					throw new DynamicToolError("Isolated tool returned an unexpected shape.");
				return { isolated: true as const, stats: parsed.data };
			},
		}),
	};
}
