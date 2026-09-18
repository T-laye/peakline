"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentFailedStep } from "@/features/pay/components/PaymentFailedStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function PaymentFailedPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const errorMessage = usePayFlowStore((state) => state.errorMessage);
	const reset = usePayFlowStore((state) => state.reset);

	useEffect(() => {
		if (!link || !errorMessage) router.replace("/pay");
	}, [link, errorMessage, router]);

	if (!link || !errorMessage) return null;

	function goToDashboard() {
		reset();
		router.push("/");
	}

	return (
		<PaymentFailedStep
			link={link}
			errorMessage={errorMessage}
			onTryAgain={() => router.push("/pay/confirm")}
			onGoToDashboard={goToDashboard}
		/>
	);
}
