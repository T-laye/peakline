"use client";

import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { TransferActions } from "@/features/transactions/components/TransferActions";
import { TransactionHistoryList } from "@/features/transactions/components/TransactionHistoryList";
import { TransactionsList } from "@/features/merchant/components/TransactionsList";
import { useAuthStore } from "@/lib/stores/authStore";

/**
 * `/transactions`'s own self-branching body — individual keeps its original
 * Send/Receive quick actions + `TransactionHistoryList`; merchant gets the
 * updated mock's own table (Customer/Amount/Method/Status/Date/Action +
 * filters + pagination), same shape as `PaymentsList`. Split out of the
 * page file itself (rather than making that a client component) so the
 * route keeps its own `<title>` via a plain server-component `metadata`
 * export.
 *
 * No `MobileStepHeader` on the merchant branch — `MerchantMobileTopBar`
 * already shows "Transactions" as a back+title+hamburger bar for this exact
 * route, same as `/payments`; individual still needs its own (no equivalent
 * top bar exists for that account type).
 */
function TransactionsPageContent() {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");

	if (isMerchant) {
		return (
			<div className="flex flex-col gap-6 sm:gap-8">
				<PageHeader title="Transactions" subtitle="All transactions" />
				<TransactionsList />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			{/* No back arrow — this is a primary bottom-tab destination, same as
			    /wallet, with nowhere obvious to go "back" to. */}
			<MobileStepHeader title="Transactions" />
			<PageHeader title="Transactions" subtitle="View your transaction history" />
			<TransferActions />
			<TransactionHistoryList />
		</div>
	);
}

export { TransactionsPageContent };
