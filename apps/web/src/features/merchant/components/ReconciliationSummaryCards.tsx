"use client";

import { Skeleton } from "@repo/ui/skeleton";
import { useReconciliationSummary } from "@/features/merchant/hooks";

function SummaryCard({ label, value, description }: { label: string; value: number; description: string }) {
	return (
		<div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<span className="truncate text-b3 text-muted-foreground">{label}</span>
			<span className="text-h5 text-foreground sm:text-h4">{value}</span>
			<span className="text-c1 text-muted-foreground">{description}</span>
		</div>
	);
}

function SummaryCardSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-8 w-16" />
			<Skeleton className="h-4 w-32" />
		</div>
	);
}

/** Reconciliation's four summary cards — straight off `GET
 * /merchant/reconciliation/summary` (confirmed live), counts only, no
 * amount totals (the endpoint doesn't return any — see `ReconciliationSummaryData`'s
 * own note). "Mismatched" shows `amountMismatch`, the real field name
 * relabeled to match the mock's own heading. */
function ReconciliationSummaryCards() {
	const { data } = useReconciliationSummary();

	if (!data) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCardSkeleton />
				<SummaryCardSkeleton />
				<SummaryCardSkeleton />
				<SummaryCardSkeleton />
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<SummaryCard
				label="Total Request Links"
				value={data.total}
				description="Payments being reconciled"
			/>
			<SummaryCard label="Matched" value={data.matched} description="Payments matched successfully" />
			<SummaryCard label="Unmatched" value={data.unmatched} description="Payments without a match" />
			<SummaryCard
				label="Mismatched"
				value={data.amountMismatch}
				description="Expected / received amount differ"
			/>
		</div>
	);
}

export { ReconciliationSummaryCards };
