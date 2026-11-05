import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const THRESHOLD_PX = 96;

/**
 * Chat-style scrolling: follow new content while the user is at the bottom,
 * stop following when they scroll up, and resume when they return or send.
 */
export function useStickToBottom<T extends HTMLElement>(contentKey: unknown) {
	const ref = useRef<T>(null);
	const stuck = useRef(true);
	const [atBottom, setAtBottom] = useState(true);

	const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
		const el = ref.current;
		if (!el) return;
		stuck.current = true;
		setAtBottom(true);
		el.scrollTo({ top: el.scrollHeight, behavior });
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onScroll = () => {
			const near = el.scrollHeight - el.scrollTop - el.clientHeight < THRESHOLD_PX;
			stuck.current = near;
			setAtBottom(near);
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run whenever streamed content changes
	useLayoutEffect(() => {
		// Instant, not smooth: smooth scrolling on every streamed chunk fights the user's wheel.
		if (stuck.current) ref.current?.scrollTo({ top: ref.current.scrollHeight });
	}, [contentKey]);

	return { ref, atBottom, scrollToBottom };
}
