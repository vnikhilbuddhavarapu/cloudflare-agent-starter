import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A titled inspector card. `source` names the primitive the data comes from. */
export function Section({
	title,
	icon: Icon,
	source,
	hint,
	action,
	children,
}: {
	title: string;
	icon: LucideIcon;
	source?: string;
	hint?: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="animate-rise-in rounded-2xl border border-line bg-surface-raised p-4 shadow-[0_1px_0_0_var(--color-line)]">
			<header className="mb-3 flex items-start justify-between gap-2">
				<div className="flex items-start gap-2.5">
					<span className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20">
						<Icon className="size-3.5" />
					</span>
					<div>
						<h2 className="text-sm font-semibold tracking-tight">{title}</h2>
						{source && <p className="font-mono text-[10.5px] text-ink-faint">{source}</p>}
					</div>
				</div>
				{action}
			</header>
			{hint && <p className="mb-3 text-xs leading-5 text-ink-muted">{hint}</p>}
			{children}
		</section>
	);
}

export function Empty({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
	return (
		<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line py-6 text-center">
			<Icon className="size-5 text-ink-faint" />
			<p className="text-xs text-ink-muted">{children}</p>
		</div>
	);
}
