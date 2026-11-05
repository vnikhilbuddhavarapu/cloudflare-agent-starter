import { FileText, NotebookPen } from "lucide-react";
import type { Note } from "../../../shared/contracts";
import { Empty, Section } from "../ui/Section";

export function NotesSection({ notes }: { notes: Note[] }) {
	return (
		<Section
			title="Notes"
			icon={NotebookPen}
			source="saveNote tool · Durable Object SQLite"
			hint="Application records written by a typed tool. Retries with the same tool call id never duplicate."
		>
			{notes.length === 0 ? (
				<Empty icon={FileText}>No notes yet. Ask the assistant to save one.</Empty>
			) : (
				<ul className="space-y-2">
					{notes.map((n) => (
						<li
							key={n.id}
							className="group animate-rise-in rounded-xl border border-line bg-surface-sunken/50 p-3 transition-colors hover:border-line-strong"
						>
							<div className="flex items-start gap-2">
								<FileText className="mt-0.5 size-3.5 shrink-0 text-accent" />
								<div className="min-w-0">
									<p className="text-sm font-medium">{n.title}</p>
									<p className="mt-0.5 line-clamp-3 text-xs leading-5 text-ink-muted">{n.body}</p>
									<time
										className="mt-1.5 block font-mono text-[10.5px] text-ink-faint"
										dateTime={n.createdAt}
									>
										{new Date(n.createdAt).toLocaleString()}
									</time>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</Section>
	);
}
