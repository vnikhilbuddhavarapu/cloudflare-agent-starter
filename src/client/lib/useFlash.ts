import { useEffect, useRef, useState } from "react";

/**
 * Returns a key that changes whenever `value` changes after the first render.
 * Use it as a React `key` on an element with `animate-flash` so live server
 * updates (another tab, a scheduled callback) are visible on stage.
 */
export function useFlashKey(value: unknown): number {
	const serialized = JSON.stringify(value);
	const previous = useRef(serialized);
	const [key, setKey] = useState(0);
	useEffect(() => {
		if (previous.current !== serialized) {
			previous.current = serialized;
			setKey((k) => k + 1);
		}
	}, [serialized]);
	return key;
}
