import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ReconciliationList } from "@/features/merchant/components/ReconciliationList";

export const metadata: Metadata = {
	title: "Reconciliation — Peakline",
};

// Merchant-only route, same nav-visibility-only gating as every other
// dashboard route (see CLAUDE.md's Monorepo layout note on merchant).
//
// No `MobileStepHeader` here — `MerchantMobileTopBar` already shows
// "Reconciliation" as a back+title+hamburger bar for this route, same as
// `/payments`/`/qr-code`.
export default function ReconciliationPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader
				title="Reconciliation"
				subtitle="Identify payments that match, investigate mismatches, and resolve unmatched payments"
			/>
			<ReconciliationList />
		</div>
	);
}
