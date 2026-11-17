"use client";

import { Info } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { useMerchantOverview } from "@/features/merchant/hooks";
import { TotalReceivedChart } from "@/features/merchant/components/TotalReceivedChart";
import { TransactionTrendChart } from "@/features/merchant/components/TransactionTrendChart";
import { useReportSummary } from "@/features/analytics/hooks";
import { ReportAreaChart, ReportBarChart } from "@/features/analytics/components/ReportCharts";
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
 * Analytics (v3 / c7 mock): nine summary cards and six charts.
 *
 * - From the real API: Total Payment Received, Pending Collections, and the
 *   Total Received / Transaction Trend charts.
 * - Derived from the payment-request and refund mock stores until the
 *   reporting endpoints exist: everything else. Net Collections is real
 *   received minus completed refunds (the brief's definition).
 *
 * The mock shows "$"; amounts here stay in USDC like the rest of the app.
 */
function AnalyticsOverview() {
	const { data: overview } = useMerchantOverview();
	const { data: report } = useReportSummary();

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard
					label="Total Payment Received"
					amount={overview?.totalReceived}
					caption="All verified incoming payments"
				/>
				<StatCard
					label="Completed Collections"
					amount={report?.completedCollections.amount}
					caption={report && plural(report.completedCollections.count, "request")}
				/>
				<StatCard
					label="Pending Collections"
					amount={overview?.pending}
					caption={overview && plural(overview.pendingCount, "Transaction")}
					tone="negative"
				/>
				<StatCard
					label="Refunds Completed"
					amount={report?.refundsCompleted.amount}
					caption={report && plural(report.refundsCompleted.count, "refund")}
				/>
				<StatCard
					label="Net Collections"
					amount={overview && report ? overview.totalReceived - report.refundsCompleted.amount : undefined}
					caption="Received minus completed refunds"
				/>
				<StatCard
					label="Outstanding request value"
					amount={report?.outstandingRequests.amount}
					caption={report && plural(report.outstandingRequests.count, "request")}
					tone="negative"
				/>
				<StatCard
					label="QR Payment Volume"
					amount={report?.qrVolume.amount}
					caption={report && plural(report.qrVolume.count, "Transaction")}
				/>
				<StatCard
					label="Payment Link Volume"
					amount={report?.paymentLinkVolume.amount}
					caption={report && plural(report.paymentLinkVolume.count, "Transaction")}
				/>
				<StatCard
					label="USDC Transaction Volume"
					amount={report?.usdcVolume.amount}
					caption={report && plural(report.usdcVolume.count, "Transaction")}
				/>
			</div>

			<div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-4 text-c1 text-muted-foreground sm:text-b3">
				<Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<p>
					Collections, refunds, outstanding requests and payment-method figures are sample data
					until the backend reporting endpoints are live. Total received, pending collections and
					the first two charts are real.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<TotalReceivedChart />
				<TransactionTrendChart />
				<ReportAreaChart kind="refunds" title="Refund Volume Over Time" />
				<ReportBarChart kind="methods" title="Payment Methods" />
				<ReportAreaChart kind="outstanding" title="Outstanding collections over time" />
				<ReportBarChart kind="collections_vs_refunds" title="Collections vs Refunds" />
			</div>
		</div>
	);
}

export { AnalyticsOverview };
