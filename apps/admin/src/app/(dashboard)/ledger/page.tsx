"use client";

import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { LedgerAccountsSection } from "@/features/ledger/components/LedgerAccountsSection";
import { SystemAccountsSection } from "@/features/ledger/components/SystemAccountsSection";
import { LedgerBalancesSection } from "@/features/ledger/components/LedgerBalancesSection";

type Tab = "accounts" | "system" | "balances";

const TABS: { key: Tab; label: string }[] = [
	{ key: "accounts", label: "Accounts" },
	{ key: "system", label: "System Accounts" },
	{ key: "balances", label: "Balances" },
];

/**
 * Ledger's own three sub-views (Accounts / System Accounts / Balances) as
 * a plain button tab-switcher rather than separate routes — a single,
 * low-traffic page, not worth the URL-per-tab overhead `AccountTabs` (a
 * genuinely two/three-destination settings page) has. None of these three
 * have a confirmed response schema (see `UnknownRecord`'s own note) —
 * every section renders through `DynamicTable`/`DynamicRecord` instead of
 * guessed columns.
 */
export default function LedgerPage() {
	const [tab, setTab] = useState<Tab>("accounts");

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Ledger</h1>
				<p className="text-b3 text-muted-foreground">
					Double-entry accounts, system float, and wallet balances.
				</p>
			</div>

			<div className="flex gap-2 border-b border-border">
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className={cn(
							"border-b-2 px-1 pb-3 text-b3 font-medium transition-colors",
							tab === t.key
								? "border-primary-500 text-primary-700"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === "accounts" && <LedgerAccountsSection />}
			{tab === "system" && <SystemAccountsSection />}
			{tab === "balances" && <LedgerBalancesSection />}
		</div>
	);
}
