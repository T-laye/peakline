"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { CreatePaymentLinkForm } from "@/features/merchant/components/CreatePaymentLinkForm";
import { PaymentLinkCreatedCard } from "@/features/merchant/components/PaymentLinkCreatedCard";

/** Reached from two places (the Payment Links list's own button, and
 * Overview's "Create Payment Link"/"Request Payment" quick actions) —
 * `router.back()` for both the header's back arrow and its desktop text
 * link, same as Send's step 1, so either entry point returns correctly. */
export default function CreatePaymentLinkPage() {
	const router = useRouter();
	const [link, setLink] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Payment Links" onBack={() => router.back()} />
			<PageHeader
				title="Create Payment Link"
				subtitle="Create a payment link to receive payment."
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<CreatePaymentLinkForm onCreated={setLink} />
				<PaymentLinkCreatedCard link={link} />
			</div>
		</div>
	);
}
