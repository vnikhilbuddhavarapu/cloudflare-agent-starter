import { Brain, BrainCircuit, Eraser } from "lucide-react";
import type { AssistantView } from "../../hooks/useAssistant";
import { cn } from "../../lib/cn";
import { useFlashKey } from "../../lib/useFlash";
import { Button } from "../ui/Button";
import { Empty, Section } from "../ui/Section";

export function MemorySection({ assistant }: { assistant: AssistantView }) {
	const memory = assistant.records.memory;
	const flash = useFlashKey(memory?.content);
	const pct = memory?.maxTokens ? Math.min(100, (memory.tokens / memory.maxTokens) * 100) : 0;
	return (
		<Section
			title="Memory"
			icon={Brain}
			source='context block "memory" · set_context'
			hint="Model-writable and token-bounded. Separate from chat history: clearing history keeps memory."
			action={
				memory?.content ? (
					<Button variant="ghost" size="sm" onClick={assistant.actions.clearMemory}>
						<Eraser className="size-3.5" /> Clear
					</Button>
				) : null
			}
		>
			{memory && memory.maxTokens === null && !memory.content ? (
				<Empty icon={BrainCircuit}>
					No writable memory block is configured yet. See session.ts.
				</Empty>
			) : memory?.content ? (
				<p
					key={flash}
					className={cn(
						"rounded-xl border border-line bg-surface-sunken p-3 text-xs leading-5 whitespace-pre-wrap",
						flash > 0 && "animate-flash",
					)}
				>
					{memory.content}
				</p>
			) : (
				<Empty icon={BrainCircuit}>Nothing remembered yet. Try "remember I prefer metric".</Empty>
			)}
			{memory?.maxTokens ? (
				<div className="mt-3">
					<div className="flex justify-between text-[11px] text-ink-muted">
						<span>Budget</span>
						<span className="font-mono tabular-nums">
							{memory.tokens} / {memory.maxTokens} tokens
						</span>
					</div>
					<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
						<div
							className="h-full rounded-full bg-linear-to-r from-accent to-accent-2 transition-[width] duration-700 ease-out"
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
			) : null}
		</Section>
	);
}
