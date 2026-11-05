import { ArrowUp, CornerDownLeft, Square } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";

const MAX_CHARS = 4_000;

export function Composer({
	busy,
	disabled,
	onSend,
	onStop,
	footer,
}: {
	busy: boolean;
	disabled: boolean;
	onSend: (text: string) => void;
	onStop: () => void;
	footer?: React.ReactNode;
}) {
	const [text, setText] = useState("");
	const ref = useRef<HTMLTextAreaElement>(null);
	const canSend = !busy && !disabled && text.trim().length > 0;

	const submit = (e?: FormEvent) => {
		e?.preventDefault();
		if (!canSend) return;
		onSend(text.trim());
		setText("");
		ref.current?.focus();
	};

	const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
	};

	return (
		<form
			onSubmit={submit}
			className={cn(
				"glass rounded-2xl p-2 shadow-lg shadow-black/5 transition-all duration-200",
				"focus-within:border-accent/50 focus-within:shadow-accent/10 focus-within:ring-4 focus-within:ring-accent/10",
				busy && "border-accent/30",
			)}
		>
			<label htmlFor="composer" className="sr-only">
				Message
			</label>
			<textarea
				id="composer"
				ref={ref}
				value={text}
				onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
				onKeyDown={onKeyDown}
				rows={1}
				placeholder={
					disabled ? "Connecting to your agent…" : "Ask anything, save a note, or set a reminder…"
				}
				className="field-sizing-content max-h-48 min-h-11 w-full resize-none bg-transparent px-2.5 py-2 text-[0.9375rem] leading-6 outline-none placeholder:text-ink-faint"
			/>
			<div className="flex items-center gap-2 px-1">
				<div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] text-ink-faint">
					{footer}
				</div>
				<span
					className={cn(
						"font-mono text-[10.5px] text-ink-faint tabular-nums",
						text.length < MAX_CHARS * 0.9 && "hidden",
					)}
				>
					{text.length}/{MAX_CHARS}
				</span>
				<span className="hidden items-center gap-1 text-[11px] text-ink-faint sm:flex">
					<span className="kbd">
						<CornerDownLeft className="size-2.5" />
					</span>
					send
				</span>
				{busy ? (
					<Button variant="secondary" size="icon-sm" onClick={onStop} aria-label="Stop generating">
						<Square className="size-3 fill-current" />
					</Button>
				) : (
					<Button
						type="submit"
						variant="primary"
						size="icon-sm"
						disabled={!canSend}
						aria-label="Send message"
					>
						<ArrowUp className="size-4" />
					</Button>
				)}
			</div>
		</form>
	);
}
