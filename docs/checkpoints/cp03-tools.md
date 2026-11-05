# CP03: Typed note tools

**Goal:** let the model save and list notes through typed tools backed by
durable storage. (12 min)

## The primitive

An AI SDK `tool()` has a `description`, a Zod `inputSchema`, and an `execute`
function. Think validates the model's arguments against the schema before
`execute` runs, then feeds the result back to the model and streams it to the
UI as a tool card.

Notes are **application records**. They live in this instance's SQLite
database (`src/agent/store/notes.ts`, provided), so each instance's notes are
isolated by construction.

Models and networks retry. `execute` receives a `toolCallId`; the store uses it
as an operation key, so a retried call returns the original note instead of
saving a duplicate.

## Your task

In `src/agent/tools/notes.ts`:

1. Bound `SaveNoteInput`: trim both fields, minimum 1 character, maximum
   `LIMITS.noteTitle` and `LIMITS.noteBody`, with `.describe()` hints.
2. Return `saveNote` and `listNotes` tools from `noteTools()`. `saveNote` returns
   `{ saved: true, note, duplicate }` and calls `onChange()` only for a new note;
   `listNotes` returns `{ notes }`.

`src/agent/tools/index.ts` already composes your tools into the agent.

## Verify

```sh
npm run test:cp03
```

Manual:

1. Say "Save a note titled Launch with body Ship on Friday."
2. A **Save note** card appears. Expand it: the input and the structured result.
3. Inspector, **Notes** tab: the note.
4. Refresh. Still there. Switch instance: not there.

The test proves the tool works. The manual check proves the model chose it.
Those are different claims.

## Common failures

| Symptom                                        | Cause                                                  |
| ---------------------------------------------- | ------------------------------------------------------ |
| Model says it saved a note but nothing appears | No `saveNote` tool registered, so the model improvised |
| Duplicate notes on retry                       | `toolCallId` is not passed to `notes.save`             |
| Notes tab does not refresh                     | `onChange()` is not called after a new save            |

## Hints

<details><summary>Hint 1: the idea</summary>

The store already handles SQL and deduplication. Your tools validate input,
call the store, signal the UI, and return plain JSON.
</details>

<details><summary>Hint 2: the APIs</summary>

- `z.string().trim().min(1).max(n).describe("...")`
- `tool({ description, inputSchema, execute: async (input, { toolCallId }) => ... })`
- `notes.save(input, operationId)` returns `{ note, duplicate }`; `notes.list()` returns `Note[]`.
</details>

<details><summary>Hint 3: the shape</summary>

```ts
return {
	saveNote: tool({
		description: "...",
		inputSchema: SaveNoteInput,
		execute: async (input, { toolCallId }) => {
			// save, maybe onChange(), return { saved: true, ...result }
		},
	}),
	listNotes: tool({ /* ... */ }),
};
```
</details>

<details><summary>Hint 4: full code</summary>

`src/agent/tools/notes.ts`: add these imports:

```ts
import { tool } from "ai";
import { LIMITS } from "../../shared/contracts";
```

Then:

```ts
export const SaveNoteInput = z.object({
	title: z.string().trim().min(1).max(LIMITS.noteTitle).describe("Short title for the note"),
	body: z.string().trim().min(1).max(LIMITS.noteBody).describe("The note content"),
});

export function noteTools(notes: NotesStore, onChange: () => void) {
	return {
		saveNote: tool({
			description:
				"Save a short note for the user. Use when the user asks to note or save something.",
			inputSchema: SaveNoteInput,
			execute: async (input, { toolCallId }) => {
				const result = notes.save(input, toolCallId);
				if (!result.duplicate) onChange();
				return { saved: true as const, ...result };
			},
		}),
		listNotes: tool({
			description: "List the user's saved notes, newest first.",
			inputSchema: z.object({}),
			execute: async () => ({ notes: notes.list() }),
		}),
	};
}
```
</details>
