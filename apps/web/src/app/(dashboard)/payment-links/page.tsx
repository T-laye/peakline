import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentLinksList } from "@/features/merchant/components/PaymentLinksList";

export const metadata: Metadata = {
	title: "Payment Links — Peakline",
};

// Merchant-only route, replacing "Request Payment" in that nav (see
// Sidebar) — same no-route-guard-yet caveat as `/payments`.
//
// No `MobileStepHeader` here — `MerchantMobileTopBar` (rendered once by
// `DashboardLayout`, above every page) already shows "Payment Links" as a
// back+title+hamburger bar for this exact route, same as `/payments`.
export default function PaymentLinksPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader
				title="Payment Links"
				subtitle="All payment links"
				action={
					<Button asChild size="large">
						<Link href="/payment-links/create">
							<Plus className="size-4" aria-hidden="true" />
							Create Payment Link
						</Link>
					</Button>
				}
			/>
			{/* Mobile equivalent of the desktop-only action above — no mock shows
			    a mobile take on this page, but leaving mobile with no way to
			    start one from here would be a real gap, not just a cosmetic one. */}
			<Button asChild size="large" className="w-full lg:hidden">
				<Link href="/payment-links/create">
					<Plus className="size-4" aria-hidden="true" />
					Create Payment Link
				</Link>
			</Button>
			<PaymentLinksList />
		</div>
	);
}
