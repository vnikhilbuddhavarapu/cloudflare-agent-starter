import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
	primary:
		"bg-linear-to-b from-accent to-[color-mix(in_oklch,var(--color-accent)_85%,black)] text-accent-ink shadow-sm shadow-accent/30 hover:brightness-110",
	secondary:
		"bg-surface-raised/70 border border-line hover:border-line-strong hover:bg-surface-raised",
	ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
	danger: "text-danger hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
	sm: "h-7 px-2.5 text-xs gap-1.5",
	md: "h-9 px-3.5 text-sm gap-2",
	icon: "size-9 justify-center",
	"icon-sm": "size-8 justify-center",
};

export function Button({
	variant = "secondary",
	size = "md",
	className,
	type = "button",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
	return (
		<button
			type={type}
			className={cn(
				"inline-flex shrink-0 items-center rounded-lg font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	);
}
