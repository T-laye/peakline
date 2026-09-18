import { useEffect, useState } from "react";

/**
 * Delays reflecting `value` until it's stopped changing for `delayMs` —
 * for anything that fires a network request per keystroke (`useWalletSearch`'s
 * name search is the first user), so a fast typist doesn't trigger a fresh
 * request (and, per this codebase's own dev-only API logging, a fresh
 * console.group in dev) on every single character.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);

	return debounced;
}

export { useDebouncedValue };
