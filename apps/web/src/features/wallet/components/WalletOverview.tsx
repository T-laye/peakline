"use client";

import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { WalletBalanceCard } from "@/features/wallet/components/WalletBalanceCard";
import { WalletAddressCard } from "@/features/wallet/components/WalletAddressCard";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { useAuthStore } from "@/lib/stores/authStore";

/**
 * `/wallet`'s content — a desktop title only shows up for merchant here
 * (per the merchant Wallet mock: "My Wallet" / "Your USDC wallet
 * overview"). The individual side of this page never had one (no mock ever
 * called for it), so this only adds it for merchant rather than retrofitting
 * a `PageHeader` onto the individual view too. Quick Actions is the
 * unmodified shared component — the mock shows the same 4 actions
 * (Send/Receive/Pay/Request) under one repeated placeholder icon, which
 * reads as an unfinished mock rather than an intentional simplification, so
 * this keeps the existing per-action icons instead of flattening them.
 *
 * No `MobileStepHeader` for merchant — `MerchantMobileTopBar` already shows
 * "Wallet" as a back+title+hamburger bar for this exact route; rendering
 * both stacked "Wallet"/"My Wallet" bars was a real duplicate-header bug.
 * Individual still needs its own (no equivalent top bar exists for that
 * account type).
 */
function WalletOverview() {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			{!isMerchant && <MobileStepHeader title="My Wallet" />}
			{isMerchant && (
				<PageHeader title="My Wallet" subtitle="Your USDC wallet overview" />
			)}
			<WalletBalanceCard />
			<WalletAddressCard />
			<div className="flex flex-col gap-3 sm:gap-4">
				<h2 className="text-s1 text-foreground sm:text-h5">Quick Actions</h2>
				<QuickActions />
			</div>
			<RecentTransactions />
		</div>
	);
}

export { WalletOverview };
