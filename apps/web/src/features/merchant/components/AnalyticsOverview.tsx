"use client";

import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { TotalReceivedChart } from "@/features/merchant/components/TotalReceivedChart";
import { TransactionTrendChart } from "@/features/merchant/components/TransactionTrendChart";
import { useAllTimePaymentMethods, useDashboardStats } from "@/features/analytics/hooks";
import {
	CollectionsVsRefundsChart,
	NetCollectionsChart,
	PaymentMethodsChart,
	RefundVolumeChart,
} from "@/features/analytics/components/ReportCharts";
import { formatUsdc } from "@/lib/currency";

function plural(count: number, noun: string) {
	return `From ${count} ${noun}${count === 1 ? "" : "s"}`;
}

function StatCard({
	label,
	amount,
	caption,
	tone = "positive",
}: {
	label: string;
	amount: number | undefined;
	caption?: string;
	tone?: "positive" | "negative";
}) {
	return (
		<div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<span className="text-b3 text-muted-foreground">{label}</span>
			{amount === undefined ? (
				<>
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-28" />
				</>
			) : (
				<>
					<span
						className={cn(
							"wrap-break-word text-h5 sm:text-h4",
							tone === "negative" ? "text-destructive" : "text-primary-700",
						)}
					>
						{formatUsdc(amount)} USDC
					</span>
					{caption && <span className="text-c1 text-muted-foreground">{caption}</span>}
				</>
			)}
		</div>
	);
}

/**
 * Analytics (v3 / c7 mock) on the v3 reporting API. Cards are all-time
 * figures for the merchant's businesses from `GET /merchant/dashboard/stats`
 * (counts where the API provides them) and per-method volume from
 * `GET /merchant/reports/payment-methods` ("QR" = funding intents, which
 * is what the merchant QR code creates). Amounts stay in USDC, not "$".
 */
function AnalyticsOverview() {
	const { data: stats } = useDashboardStats("month");
	const { byMethod } = useAllTimePaymentMethods();
	const amount = (value: { amount: string } | undefined) => (value ? Number(value.amount) : undefined);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard label="Total Payment Received" amount={amount(stats?.totalReceived)} caption="All verified incoming payments" />
				<StatCard
					label="Completed Collections"
					amount={amount(stats?.completedCollections)}
					caption={stats && plural(stats.completedCollections.count, "request")}
				/>
				<StatCard
					label="Pending Collections"
					amount={amount(stats?.pending)}
					caption={stats && plural(stats.pending.count, "Transaction")}
					tone="negative"
				/>
				<StatCard label="Refunds Completed" amount={amount(stats?.refundsCompleted)} caption="All completed refunds" />
				<StatCard label="Net Collections" amount={amount(stats?.netCollections)} caption="Received minus completed refunds" />
				<StatCard
					label="Outstanding request value"
					amount={amount(stats?.outstandingRequests)}
					caption={stats && plural(stats.outstandingRequests.count, "request")}
					tone="negative"
				/>
				<StatCard
					label="QR Payment Volume"
					amount={byMethod?.("funding_intent").amount}
					caption={byMethod && plural(byMethod("funding_intent").count, "Transaction")}
				/>
				<StatCard
					label="Payment Link Volume"
					amount={byMethod ? byMethod("payment_link").amount + byMethod("payment_request").amount : undefined}
					caption={byMethod && plural(byMethod("payment_link").count + byMethod("payment_request").count, "Transaction")}
				/>
				<StatCard label="USDC Transaction Volume" amount={amount(stats?.usdcVolume)} caption="Received + sent" />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<TotalReceivedChart />
				<TransactionTrendChart />
				<RefundVolumeChart />
				<PaymentMethodsChart />
				<NetCollectionsChart />
				<CollectionsVsRefundsChart />
			</div>
		</div>
	);
}

export { AnalyticsOverview };
