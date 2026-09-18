"use client";

import Link from "next/link";
import { Send, ArrowDownLeft } from "lucide-react";

const ACTIONS = [
	{ label: "Send", href: "/send", icon: Send },
	{ label: "Receive", href: "/receive", icon: ArrowDownLeft },
] as const;

/**
 * The mobile Transactions tab's primary job, per the mock: a chooser for
 * transfer direction. `lg:hidden` — at desktop widths the Sidebar already
 * lists Send/Receive as their own nav items, so repeating them here would
 * be redundant (confirmed by the desktop mock, which shows none of this on
 * `/transactions`). "Pay" (scan) has its own dedicated spot either way —
 * `BottomTabBar`'s elevated center action — so it's not included here
 * alongside these two.
 */
function TransferActions() {
	return (
		<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
			{ACTIONS.map(({ label, href, icon: Icon }) => (
				<Link
					key={label}
					href={href}
					className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-colors hover:bg-muted sm:gap-3 sm:p-6"
				>
					<span className="flex size-10 items-center justify-center rounded-full bg-primary-500/10 sm:size-12">
						<Icon className="size-5 text-primary-600 sm:size-6" aria-hidden="true" />
					</span>
					<span className="text-c2 text-foreground sm:text-b2">{label}</span>
				</Link>
			))}
		</div>
	);
}

export { TransferActions };
