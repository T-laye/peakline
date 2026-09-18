"use client";

import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";

interface AccountTab {
	key: string;
	label: string;
	content: React.ReactNode;
}

/**
 * Desktop-only left mini-nav + right content panel for the Account page —
 * Personal Information / [Business Information] / Account Settings, per
 * the mock (2 tabs for individual, 3 for merchant — see `AccountPage`,
 * which decides the tab list itself and passes it in here). Plain local
 * `useState`, not URL-synced — the mock shows no distinct URL per tab, and
 * nothing about "which settings tab was open" needs to survive a refresh
 * or be linkable.
 *
 * Mobile doesn't use this at all — `AccountPage` renders an entirely
 * different, list-based layout below `lg` (see its own note), so this
 * component is `hidden lg:flex` at its own root rather than trying to
 * double as both.
 */
function AccountTabs({ tabs }: { tabs: AccountTab[] }) {
	const [active, setActive] = useState(tabs[0]!.key);
	const activeTab = tabs.find((tab) => tab.key === active) ?? tabs[0]!;

	return (
		<div className="hidden gap-8 lg:flex">
			<nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border pr-4">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActive(tab.key)}
						className={cn(
							"rounded-lg px-4 py-2.5 text-left text-b3 font-medium transition-colors",
							tab.key === active
								? "bg-primary-100 text-primary-700"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{tab.label}
					</button>
				))}
			</nav>
			<div className="min-w-0 flex-1">{activeTab.content}</div>
		</div>
	);
}

export { AccountTabs };
export type { AccountTab };
