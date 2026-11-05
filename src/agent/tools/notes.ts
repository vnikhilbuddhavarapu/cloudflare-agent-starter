import { z } from "zod";
import type { NotesStore } from "../store/notes";

// EXERCISE CP03: bound these fields using LIMITS from ../../shared/contracts.
export const SaveNoteInput = z.object({
	title: z.string(),
	body: z.string(),
});

// EXERCISE CP03: return saveNote and listNotes tools. See docs/checkpoints/cp03-tools.md.
export function noteTools(_notes: NotesStore, _onChange: () => void) {
	return {};
}
