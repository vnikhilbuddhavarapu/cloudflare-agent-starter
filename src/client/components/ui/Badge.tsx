import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type Tone = "neutral" | "success" | "danger" | "warning" | "accent";

const tones: Record<Tone, string> = {
	neutral: "bg-surface-sunken text-ink-muted",
	success: "bg-success/12 text-success",
	danger: "bg-danger/12 text-danger",
	warning: "bg-warning/15 text-warning",
	accent: "bg-accent/12 text-accent",
};

export function Badge({
	tone = "neutral",
	children,
	className,
}: {
	tone?: Tone;
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
				tones[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}

export function Dot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
	const color = {
		neutral: "bg-ink-muted",
		success: "bg-success",
		danger: "bg-danger",
		warning: "bg-warning",
		accent: "bg-accent",
	}[tone];
	return (
		<span className="relative inline-flex size-2">
			{pulse && (
				<span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />
			)}
			<span className={cn("relative inline-flex size-2 rounded-full", color)} />
		</span>
	);
}
