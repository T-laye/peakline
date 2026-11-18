import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { RefundsList } from "@/features/refunds/components/RefundsList";
import { SelectPaymentDialog } from "@/features/refunds/components/SelectPaymentDialog";

export const metadata: Metadata = {
	title: "Refund Management — Peakline",
};

// Merchant-only (same no-route-guard-yet caveat as `/payment-links`).
export default function RefundsPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader
				title="Refund Management"
				subtitle="Track and issue refunds on verified payments"
				action={<SelectPaymentDialog />}
			/>
			<div className="lg:hidden">
				<SelectPaymentDialog triggerClassName="w-full" />
			</div>
			<RefundsList />
		</div>
	);
}
