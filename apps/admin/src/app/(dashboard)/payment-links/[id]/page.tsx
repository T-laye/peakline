"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { PaymentLinkDetail } from "@/features/payment-links/components/PaymentLinkDetail";

export default function PaymentLinkDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant="ghost"
					size="small"
					iconOnly
					aria-label="Back to Payment Links"
					onClick={() => router.push("/payment-links")}
				>
					<ArrowLeft className="size-4" aria-hidden="true" />
				</Button>
				<h1 className="text-h4 text-foreground">Payment Link</h1>
			</div>
			<PaymentLinkDetail id={params.id} />
		</div>
	);
}
