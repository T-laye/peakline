"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPayStepHeader } from "@/features/pay/components/ExternalPayStepHeader";
import { ExternalWalletAddressStep } from "@/features/pay/components/ExternalWalletAddressStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalWalletPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const senderAddress = usePayFlowStore((state) => state.externalSenderAddress);
	const setSenderAddress = usePayFlowStore((state) => state.setExternalSenderAddress);

	// Reached without a payment link looked up in this session — send back.
	useEffect(() => {
		if (!link) router.replace("/pay");
	}, [link, router]);

	if (!link) return null;

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<ExternalPayStepHeader step={1} onBack={() => router.push("/pay")} />
			<ExternalWalletAddressStep
				link={link}
				defaultAddress={senderAddress}
				onContinue={(address) => {
					setSenderAddress(address);
					router.push("/pay/external/transaction");
				}}
			/>
		</div>
	);
}
