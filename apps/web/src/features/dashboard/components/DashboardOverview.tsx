"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { GreetingHeader } from "@/features/dashboard/components/GreetingHeader";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { MerchantStatsCards } from "@/features/merchant/components/MerchantStatsCards";
import { MerchantQuickActions } from "@/features/merchant/components/MerchantQuickActions";
import { TotalReceivedChart } from "@/features/merchant/components/TotalReceivedChart";
import { RecentPaymentsSection } from "@/features/merchant/components/RecentPaymentsSection";

/**
 * The dashboard's home route (`/`) branches by account type rather than
 * living at two different URLs — merchant is a permission on this same
 * `apps/web`, not a separate app (see CLAUDE.md's Monorepo layout).
 *
 * Merchant's own hero used to swap `MerchantStatsCards` out for the
 * individual dashboard's "Available Balance" `BalanceCard` on mobile only
 * — reported live as wrong (mobile showed "wallet" instead of the proper
 * stat cards desktop already had): `MerchantStatsCards` is now the same on
 * both breakpoints, its own `grid-cols-1 sm:grid-cols-3` already stacking
 * cleanly into three full-width cards on a narrow screen with no separate
 * mobile treatment needed. Both breakpoints still get the "Total Received"
 * trend chart and the paginated "Recent Payments" table/cards below Quick
 * Actions.
 */
function DashboardOverview() {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<GreetingHeader />

			{isMerchant ? (
				<>
					<MerchantStatsCards />

					<div className="flex flex-col gap-3 sm:gap-4">
						<h2 className="text-s1 text-foreground sm:text-h5">Quick Actions</h2>
						<MerchantQuickActions />
					</div>

					<TotalReceivedChart />
					<RecentPaymentsSection />
				</>
			) : (
				<>
					<BalanceCard />
					<div className="flex flex-col gap-3 sm:gap-4">
						<h2 className="text-s1 text-foreground sm:text-h5">Quick Actions</h2>
						<QuickActions />
					</div>
					<RecentTransactions />
				</>
			)}
		</div>
	);
}

export { DashboardOverview };
