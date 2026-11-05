import type { UIMessage } from "ai";
import { Check, Copy, Sparkles } from "lucide-react";
import { memo, type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";
import { Markdown } from "./Markdown";
import { isToolPart, ToolCard } from "./ToolCard";

const textOf = (m: UIMessage) =>
	m.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("\n\n");

/**
 * Renders text and tool parts only. Reasoning parts are deliberately not
 * shown: hidden model reasoning is not an inspection or trace surface.
 */
export const Message = memo(function Message({
	message,
	pending = false,
}: {
	message: UIMessage;
	/** True while this is the reply being generated. */
	pending?: boolean;
}) {
	if (message.role === "user") {
		return (
			<article data-role="user" className="flex animate-rise-in justify-end">
				<p className="max-w-[85%] rounded-2xl rounded-br-md border border-line bg-surface-raised px-4 py-2.5 text-[0.9375rem] leading-7 whitespace-pre-wrap shadow-sm">
					{textOf(message)}
				</p>
			</article>
		);
	}
	const text = textOf(message);
	// Models often stream hidden reasoning first; until visible output arrives,
	// show the thinking shimmer inside this same row instead of an empty bubble.
	const hasVisible = text.trim().length > 0 || message.parts.some(isToolPart);
	return (
		<AssistantRow dataRole={message.role}>
			{!hasVisible && pending && <ThinkingShimmer />}
			{message.parts.map((part, i) => {
				if (part.type === "text")
					// biome-ignore lint/suspicious/noArrayIndexKey: text parts have no id and are append-only within a message
					return <Markdown key={`${message.id}-${i}`} text={part.text} />;
				if (isToolPart(part)) return <ToolCard key={part.toolCallId} part={part} />;
				return null;
			})}
			{text && !pending && <CopyButton text={text} />}
		</AssistantRow>
	);
});

function AssistantRow({ dataRole, children }: { dataRole: string; children: ReactNode }) {
	return (
		<article data-role={dataRole} className="group flex animate-rise-in gap-3">
			<div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent-2 text-accent-ink shadow-sm shadow-accent/30">
				<Sparkles className="size-3.5" />
			</div>
			<div className="min-w-0 flex-1 space-y-2.5">{children}</div>
		</article>
	);
}

/** Placeholder row shown after sending, before the server creates the assistant message. */
export function PendingReply() {
	return (
		<AssistantRow dataRole="assistant-pending">
			<ThinkingShimmer />
		</AssistantRow>
	);
}

function ThinkingShimmer() {
	return (
		<div className="flex h-7 items-center">
			<div className="h-3 w-40 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-surface-sunken),var(--color-line-strong),var(--color-surface-sunken))] bg-size-[200%_100%]">
				<span className="sr-only">Assistant is thinking</span>
			</div>
		</div>
	);
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			aria-label={copied ? "Copied" : "Copy message"}
			onClick={async () => {
				await navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className={cn(
				"inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-sunken hover:text-ink focus-visible:opacity-100",
				copied && "text-success opacity-100",
			)}
		>
			{copied ? <Check className="size-3" /> : <Copy className="size-3" />}
			{copied ? "Copied" : "Copy"}
		</button>
	);
}
