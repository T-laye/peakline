"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

const FROM_CLASS = {
	up: "translate-y-6",
	left: "-translate-x-6",
	right: "translate-x-6",
} as const;

interface RevealProps {
	children: ReactNode;
	className?: string;
	/** Passed through and merged with the transition-delay style this
	 * component sets itself — for callers that also need e.g. a CSS
	 * `aspectRatio` on the same node rather than an extra wrapper div. */
	style?: CSSProperties;
	/** Extra delay in ms — for staggering a list of siblings (pass `index * 80`
	 * or similar), not for a one-off section. */
	delay?: number;
	/** Direction the content settles in from. */
	from?: keyof typeof FROM_CLASS;
	/** "scroll" (default) fires once via IntersectionObserver, for below-the-
	 * fold content. "mount" fires right after first paint instead — for
	 * above-the-fold content (Hero) that's visible immediately, where there's
	 * nothing to scroll *to* but a staggered entrance still reads as polish
	 * rather than the page just snapping in fully-formed. */
	mode?: "scroll" | "mount";
}

/**
 * Fade/slide-in used across the landing page — see `mode` above for the two
 * trigger styles. Fires once and stays visible; toggling back to hidden on
 * every scroll direction reads as flickery, not slick. Respects
 * `prefers-reduced-motion` by skipping straight to the visible state rather
 * than disabling only the transition (a reduced-motion user would otherwise
 * still get a hard, instant "content is hidden until triggered" cut).
 */
function Reveal({ children, className, delay = 0, from = "up", mode = "scroll", style }: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	// Lazy initializer, not an effect: reading matchMedia during render (not
	// as a side effect) is what lets a reduced-motion visitor start already
	// visible instead of synchronously flipping state right after mount.
	const [visible, setVisible] = useState(
		() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	);

	useEffect(() => {
		if (visible) return; // already settled (reduced motion, or re-triggered)

		if (mode === "mount") {
			// rAF, not a bare setVisible(true): needs to happen in a callback
			// *after* the initial (hidden) paint has already committed, or the
			// browser has nothing to transition from.
			const raf = requestAnimationFrame(() => setVisible(true));
			return () => cancelAnimationFrame(raf);
		}

		const node = ref.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				setVisible(true);
				observer.disconnect();
			},
			{ threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [visible, mode]);

	return (
		<div
			ref={ref}
			className={cn(
				"transition-all duration-700 ease-out",
				visible ? "translate-x-0 translate-y-0 opacity-100" : `opacity-0 ${FROM_CLASS[from]}`,
				className,
			)}
			style={{ ...style, transitionDelay: visible && delay ? `${delay}ms` : "0ms" }}
		>
			{children}
		</div>
	);
}

export { Reveal };
