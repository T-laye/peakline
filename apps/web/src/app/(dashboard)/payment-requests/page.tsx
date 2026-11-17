import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentRequestsList } from "@/features/payment-requests/components/PaymentRequestsList";

export const metadata: Metadata = {
	title: "Payment Requests — Peakline",
};

// Merchant-only (same no-route-guard-yet caveat as `/payment-links`).
export default function PaymentRequestsPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader
				title="Payment Requests"
				subtitle="All payment requests"
				action={
					<Button asChild size="large">
						<Link href="/payment-requests/create">
							<Plus className="size-4" aria-hidden="true" />
							Create Payment Request
						</Link>
					</Button>
				}
			/>
			<Button asChild size="large" className="w-full lg:hidden">
				<Link href="/payment-requests/create">
					<Plus className="size-4" aria-hidden="true" />
					Create Payment Request
				</Link>
			</Button>
			<PaymentRequestsList />
		</div>
	);
}
