"use client";

import { useRouter } from "next/navigation";
import { SendStepHeader } from "@/features/send/components/SendStepHeader";
import { SendMoneyFormStep } from "@/features/send/components/SendMoneyFormStep";
import { useSendMoneyFlowStore } from "@/features/send/store/sendMoneyFlowStore";

/**
 * The regular, manual-entry Send — pick a method, type/search/verify a
 * recipient (see `SendMoneyFormStep`'s own note on the phone-verify/
 * name-search additions), then amount. A recipient arriving already
 * resolved (someone's Receive QR/link, or a bare wallet address) is
 * `/pay`'s job now, not this page's — reported live: that belongs in the
 * Pay section's own single-card flow (`PersonPaymentCard`), not a detour
 * through this multi-step form. See `lib/wallet.ts`'s `buildReceiveLink`
 * and `/pay/page.tsx`'s own notes.
 */
export default function SendMoneyPage() {
	const router = useRouter();
	const values = useSendMoneyFlowStore((state) => state.values);
	const setValues = useSendMoneyFlowStore((state) => state.setValues);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<SendStepHeader step={1} onBack={() => router.back()} />
			<SendMoneyFormStep
				defaultValues={values}
				onContinue={(submitted) => {
					setValues(submitted);
					router.push("/send/review");
				}}
			/>
		</div>
	);
}
