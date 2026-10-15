"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPaymentFailedStep } from "@/features/pay/components/ExternalPaymentFailedStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalPaymentFailedPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const errorMessage = usePayFlowStore((state) => state.errorMessage);
	const reset = usePayFlowStore((state) => state.reset);

	useEffect(() => {
		if (!link || !errorMessage) router.replace("/pay");
	}, [link, errorMessage, router]);

	if (!link || !errorMessage) return null;

	return (
		<ExternalPaymentFailedStep
			link={link}
			errorMessage={errorMessage}
			onTryAgain={() => router.push("/pay/external/transaction")}
			onGoToDashboard={() => {
				reset();
				router.push("/");
			}}
		/>
	);
}
