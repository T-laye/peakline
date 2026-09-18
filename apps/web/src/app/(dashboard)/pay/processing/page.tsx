"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentProcessingStep } from "@/features/pay/components/PaymentProcessingStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function PaymentProcessingPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const pin = usePayFlowStore((state) => state.pin);
	const setResult = usePayFlowStore((state) => state.setResult);
	const setErrorMessage = usePayFlowStore((state) => state.setErrorMessage);

	useEffect(() => {
		if (!link || !pin) router.replace("/pay");
	}, [link, pin, router]);

	if (!link || !pin) return null;

	return (
		<PaymentProcessingStep
			link={link}
			pin={pin}
			onSuccess={(result) => {
				setResult(result);
				router.replace("/pay/success");
			}}
			onError={(message) => {
				setErrorMessage(message);
				router.replace("/pay/failed");
			}}
		/>
	);
}
