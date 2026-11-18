"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentLinkCreatedCard } from "@/features/merchant/components/PaymentLinkCreatedCard";
import { CreatePaymentRequestForm } from "@/features/payment-requests/components/CreatePaymentRequestForm";
import type { PaymentLinkData } from "@/lib/api/types";

/** c2 mock — form on the left, the share panel (link, Share via, inline QR)
 * on the right once the request exists. */
export default function CreatePaymentRequestPage() {
	const router = useRouter();
	const [request, setRequest] = useState<PaymentLinkData | null>(null);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Payment Requests" onBack={() => router.back()} />
			<PageHeader
				title="Create Payment Request"
				subtitle="Create a payment request to receive payment."
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<CreatePaymentRequestForm onCreated={setRequest} />
				<div className="lg:sticky lg:top-6 lg:self-start">
					<PaymentLinkCreatedCard link={request?.url ?? null} inlineQr />
				</div>
			</div>
		</div>
	);
}
