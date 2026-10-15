"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPaymentVerifyingStep } from "@/features/pay/components/ExternalPaymentVerifyingStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalPaymentVerifyingPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const senderAddress = usePayFlowStore((state) => state.externalSenderAddress);
	const txHash = usePayFlowStore((state) => state.externalTxHash);
	const setVerification = usePayFlowStore((state) => state.setVerification);
	const setErrorMessage = usePayFlowStore((state) => state.setErrorMessage);

	useEffect(() => {
		if (!link || !senderAddress || !txHash) router.replace("/pay");
	}, [link, senderAddress, txHash, router]);

	if (!link || !senderAddress || !txHash) return null;

	return (
		<ExternalPaymentVerifyingStep
			link={link}
			senderAddress={senderAddress}
			txHash={txHash}
			onResult={(verification) => {
				setVerification(verification);
				router.replace(
					verification.status === "verified"
						? "/pay/external/verified"
						: "/pay/external/reconciliation",
				);
			}}
			onError={(message) => {
				setErrorMessage(message);
				router.replace("/pay/external/failed");
			}}
		/>
	);
}
