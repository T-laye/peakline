"use client";

import { AlertTriangle, Users, Building2, TrendingUp, Link2, Clock, Coins } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { useAdminOverview } from "@/features/analytics/hooks";
import { formatUsdc } from "@/lib/currency";

function StatCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string;
	icon: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5">
			<div className="flex items-center gap-2 text-muted-foreground">
				<Icon className="size-4" aria-hidden="true" />
				<span className="text-b4">{label}</span>
			</div>
			<span className="text-h4 text-foreground">{value}</span>
		</div>
	);
}

/** The dashboard home — `AdminOverviewDto`'s platform-wide totals as a
 * stat-card grid. Deliberately just this for Phase 0/1 — the 3
 * `AdminChartPointDto` series (users/transactions/businesses over time)
 * become actual charts once `recharts` is wired up for a real screen,
 * rather than guessing at a chart shape now. */
function OverviewCards() {
	const { data, isLoading, isError } = useAdminOverview();

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-28 w-full rounded-2xl" />
				))}
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={AlertTriangle}
					title="Couldn't load overview"
					description="Something went wrong fetching platform stats. Try refreshing."
				/>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard label="Total Users" value={data.totalUsers.toLocaleString()} icon={Users} />
			<StatCard
				label="Total Merchants"
				value={data.totalMerchants.toLocaleString()}
				icon={Building2}
			/>
			<StatCard
				label="Total Volume"
				value={`${formatUsdc(data.totalVolume)} USDC`}
				icon={TrendingUp}
			/>
			<StatCard
				label="Total Deposits"
				value={`${formatUsdc(data.totalDeposits)} USDC`}
				icon={Coins}
			/>
			<StatCard
				label="Active Payment Links"
				value={data.activePaymentLinks.toLocaleString()}
				icon={Link2}
			/>
			<StatCard
				label="Pending Funding Intents"
				value={data.pendingFundingIntents.toLocaleString()}
				icon={Clock}
			/>
		</div>
	);
}

export { OverviewCards };
