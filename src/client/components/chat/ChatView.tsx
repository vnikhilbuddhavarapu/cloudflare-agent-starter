import { ArrowDown, CircleAlert, Cpu } from "lucide-react";
import { MODELS } from "../../../shared/contracts";
import type { AssistantView } from "../../hooks/useAssistant";
import { cn } from "../../lib/cn";
import { useStickToBottom } from "../../lib/useStickToBottom";
import { Composer } from "./Composer";
import { EmptyState } from "./EmptyState";
import { Message, PendingReply } from "./Message";

export function ChatView({ assistant }: { assistant: AssistantView }) {
	const { chat, connection, state } = assistant;
	const { messages, status, error } = chat;
	const busy = status === "submitted" || status === "streaming";
	const model = MODELS.find((m) => m.id === state?.model);
	const { ref, atBottom, scrollToBottom } = useStickToBottom<HTMLDivElement>(messages);

	const send = (text: string) => {
		chat.sendMessage({ text });
		// Sending is an explicit intent to follow the new reply.
		requestAnimationFrame(() => scrollToBottom("smooth"));
	};

	return (
		<div className="relative flex h-full min-h-0 flex-col">
			<div ref={ref} className="min-h-0 flex-1 overflow-y-auto">
				{messages.length === 0 ? (
					<EmptyState onPick={send} />
				) : (
					// Bottom padding keeps the last message clear of the floating composer.
					<div className="mx-auto max-w-3xl space-y-7 px-4 pt-8 pb-48">
						{messages.map((m, i) => (
							<Message
								key={m.id}
								message={m}
								pending={busy && i === messages.length - 1 && m.role === "assistant"}
							/>
						))}
						{busy && messages.at(-1)?.role !== "assistant" && <PendingReply />}
					</div>
				)}
			</div>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-surface via-surface/90 to-transparent pt-10">
				<div className="pointer-events-auto mx-auto w-full max-w-3xl px-4 pb-4">
					<div
						className={cn(
							"mb-2 flex justify-center transition-all duration-200",
							atBottom || messages.length === 0
								? "pointer-events-none translate-y-2 opacity-0"
								: "opacity-100",
						)}
					>
						<button
							type="button"
							onClick={() => scrollToBottom("smooth")}
							tabIndex={atBottom ? -1 : 0}
							className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg shadow-black/10 transition-colors hover:border-line-strong"
						>
							<ArrowDown className="size-3.5" />
							{busy ? "New reply" : "Jump to latest"}
						</button>
					</div>
					{error && (
						<div
							role="alert"
							className="mb-2 flex animate-rise-in items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger backdrop-blur"
						>
							<CircleAlert className="mt-0.5 size-4 shrink-0" />
							<span>{error.message}</span>
						</div>
					)}
					<Composer
						busy={busy}
						disabled={connection !== "connected"}
						onSend={send}
						onStop={() => chat.stop()}
						footer={
							<>
								<span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-sunken/60 px-1.5 py-0.5 font-mono text-[10.5px]">
									<Cpu className="size-3" />
									{model?.label ?? "…"}
								</span>
								<span className="capitalize">{state?.responseStyle}</span>
								<span className="sr-only" data-testid="status">
									{status}
								</span>
							</>
						}
					/>
				</div>
			</div>
		</div>
	);
}
