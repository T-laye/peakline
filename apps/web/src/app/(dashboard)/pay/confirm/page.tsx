"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { ConfirmPaymentStep } from "@/features/pay/components/ConfirmPaymentStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ConfirmPaymentPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const setPin = usePayFlowStore((state) => state.setPin);

	// Reached without a payment link looked up in this session — send back.
	useEffect(() => {
		if (!link) router.replace("/pay");
	}, [link, router]);

	if (!link) return null;

	return (
		<div className="flex flex-col gap-6">
			<MobileStepHeader title="Pay" onBack={() => router.push("/pay")} />
			<ConfirmPaymentStep
				link={link}
				onContinue={(pin) => {
					setPin(pin);
					router.push("/pay/processing");
				}}
			/>
		</div>
	);
}
