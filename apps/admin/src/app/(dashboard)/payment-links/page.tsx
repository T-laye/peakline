import type { Metadata } from "next";
import { PaymentLinksList } from "@/features/payment-links/components/PaymentLinksList";

export const metadata: Metadata = { title: "Payment Links — Peakline Admin" };

export default function PaymentLinksPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Payment Links</h1>
				<p className="text-b3 text-muted-foreground">
					Every payment link created across all businesses.
				</p>
			</div>
			<PaymentLinksList />
		</div>
	);
}
