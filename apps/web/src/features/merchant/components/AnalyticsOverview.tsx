"use client";

import { Info } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { useMerchantOverview, useReconciliationSummary } from "@/features/merchant/hooks";
import { TotalReceivedChart } from "@/features/merchant/components/TotalReceivedChart";
import { TransactionTrendChart } from "@/features/merchant/components/TransactionTrendChart";
import { formatUsdc } from "@/lib/currency";

function StatCardSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-8 w-24" />
			<Skeleton className="h-4 w-32" />
		</div>
	);
}

/**
 * Analytics — real data only. The mock's "Total Payment"/"Successful
 * Payment"/"QR Payment Volume"/"Payment Link Volume" cards all pair an
 * amount with a transaction count, a shape confirmed live to not exist
 * anywhere (`totalReceived`/`todaysPayments`/etc. only ever carry `amount`
 * + `changePct`; no endpoint splits volume by method either). Rather than
 * fabricate those four, this ships only what's real: Pending (the one
 * amount+count pair that genuinely exists) and Failed (from the
 * reconciliation summary's own `failed` count), plus the same two charts
 * Overview already has — and says plainly what's still missing instead of
 * quietly dropping it.
 */
function AnalyticsOverview() {
	const { data: overview } = useMerchantOverview();
	const { data: reconciliation } = useReconciliationSummary();

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{!overview ? (
					<StatCardSkeleton />
				) : (
					<div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
						<span className="text-b3 text-muted-foreground">Pending Payments</span>
						<span className="wrap-break-word text-h5 text-destructive sm:text-h4">
							{formatUsdc(overview.pending)} {overview.currency}
						</span>
						<span className="text-c1 text-muted-foreground">
							From {overview.pendingCount} Transaction{overview.pendingCount === 1 ? "" : "s"}
						</span>
					</div>
				)}

				{!reconciliation ? (
					<StatCardSkeleton />
				) : (
					<div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
						<span className="text-b3 text-muted-foreground">Failed Payments</span>
						<span className="wrap-break-word text-h5 text-foreground sm:text-h4">
							{reconciliation.failed}
						</span>
						<span className="text-c1 text-muted-foreground">From reconciliation records</span>
					</div>
				)}
			</div>

			<div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-4 text-c1 text-muted-foreground sm:text-b3">
				<Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<p>
					A breakdown by total/successful payment volume and by payment method (QR vs. Payment
					Link) isn&apos;t shown here yet — the backend doesn&apos;t have an endpoint for that
					split. These two cards and the charts below are the metrics that do exist today.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<TotalReceivedChart />
				<TransactionTrendChart />
			</div>
		</div>
	);
}

export { AnalyticsOverview };
