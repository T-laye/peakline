import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentsList } from "@/features/merchant/components/PaymentsList";

export const metadata: Metadata = {
	title: "Payments — Peakline",
};

// Merchant-only route (no individual nav item links here) — no route guard
// exists yet, matching every other dashboard route today; gating is by nav
// visibility only, per CLAUDE.md's Monorepo layout note on merchant.
//
// No `MobileStepHeader` here — `MerchantMobileTopBar` (rendered once by
// `DashboardLayout`, above every page) already shows "Payments" as a
// back+title+hamburger bar for this route, per the updated mock. Desktop
// still gets its own `PageHeader` (title + subtitle), same as ever.
export default function PaymentsPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader title="Payments" subtitle="All incoming payments" />
			<PaymentsList />
		</div>
	);
}
