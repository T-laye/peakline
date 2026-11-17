"use client";

import { Skeleton } from "@repo/ui/skeleton";
import { formatUsdc } from "@/lib/currency";
import { usePaymentRequestStats } from "@/features/payment-requests/hooks";

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<span className="text-b3 text-muted-foreground">{label}</span>
			<span className="text-h4 text-foreground">{value}</span>
		</div>
	);
}

/** Outstanding collection value hero card + the four count cards, per mock. */
function PaymentRequestsStatsCards() {
	const { data } = usePaymentRequestStats();

	if (!data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-32 w-full rounded-2xl" />
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{Array.from({ length: 4 }, (_, i) => (
						<Skeleton key={i} className="h-28 w-full rounded-2xl" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:gap-3 sm:p-6">
				<span className="text-b3 text-muted-foreground sm:text-b2">Outstanding collection value</span>
				<span className="text-h4 text-foreground sm:text-h3">
					{formatUsdc(Number(data.outstandingAmount))} USDC
				</span>
			</div>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard label="Total requests" value={data.total} />
				<StatCard label="Pending requests" value={data.pending} />
				<StatCard label="Paid requests" value={data.paid} />
				<StatCard label="Expired requests" value={data.expired} />
			</div>
		</div>
	);
}

export { PaymentRequestsStatsCards };
