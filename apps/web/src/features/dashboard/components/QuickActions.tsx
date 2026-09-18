"use client";

import Link from "next/link";
import { Send, ArrowDownLeft, ScanLine } from "lucide-react";

const ACTIONS = [
	{ label: "Send", href: "/send", icon: Send },
	{ label: "Receive", href: "/receive", icon: ArrowDownLeft },
	{ label: "Pay", href: "/pay", icon: ScanLine },
] as const;

/** Stays a single row at every width, per the mock (mobile just shrinks
 * padding/icon size rather than wrapping). Static links, not
 * data-dependent — the earlier loading-skeleton gate here was timed
 * entirely artificially (no real "quick actions" endpoint has ever
 * existed), so it's dropped rather than kept as a delay with nothing real
 * behind it. */
function QuickActions() {
	return (
		<div className="grid grid-cols-3 gap-2 sm:gap-4">
			{ACTIONS.map(({ label, href, icon: Icon }) => (
				<Link
					key={label}
					href={href}
					className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-colors hover:bg-muted sm:gap-3 sm:p-5"
				>
					<span className="flex size-8 items-center justify-center rounded-full bg-primary-500/10 sm:size-10">
						<Icon className="size-4 text-primary-600 sm:size-5" aria-hidden="true" />
					</span>
					<span className="text-c2 text-foreground sm:text-b2">{label}</span>
				</Link>
			))}
		</div>
	);
}

export { QuickActions };
