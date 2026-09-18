"use client";

import { Skeleton } from "@repo/ui/skeleton";
import { usePaymentLinksStats } from "@/features/merchant/hooks";

function StatCardSkeleton() {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-8 w-12" />
		</div>
	);
}

/**
 * Payment Links' own header stat row — same card shell as
 * `MerchantStatsCards`, just label + a plain count (no trend line, per this
 * mock's own simpler cards).
 */
function PaymentLinksStatsCards() {
	const { data } = usePaymentLinksStats();

	if (!data) {
		return (
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCardSkeleton />
				<StatCardSkeleton />
				<StatCardSkeleton />
				<StatCardSkeleton />
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<span className="text-b3 text-muted-foreground">Total Links</span>
				<span className="text-h4 text-foreground">{data.total}</span>
			</div>

			<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<span className="text-b3 text-muted-foreground">Active Links</span>
				<span className="text-h4 text-foreground">{data.active}</span>
			</div>

			<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<span className="text-b3 text-muted-foreground">Expired Links</span>
				<span className="text-h4 text-foreground">{data.expired}</span>
			</div>

			<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<span className="text-b3 text-muted-foreground">Cancelled Links</span>
				<span className="text-h4 text-foreground">{data.cancelled}</span>
			</div>
		</div>
	);
}

export { PaymentLinksStatsCards };
