"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPaymentVerifyingStep } from "@/features/pay/components/ExternalPaymentVerifyingStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalPaymentVerifyingPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const claimId = usePayFlowStore((state) => state.externalClaimId);
	const txHash = usePayFlowStore((state) => state.externalTxHash);
	const setVerification = usePayFlowStore((state) => state.setVerification);
	const setErrorMessage = usePayFlowStore((state) => state.setErrorMessage);

	useEffect(() => {
		if (!link || !claimId || !txHash) router.replace("/pay");
	}, [link, claimId, txHash, router]);

	if (!link || !claimId || !txHash) return null;

	return (
		<ExternalPaymentVerifyingStep
			link={link}
			claimId={claimId}
			txHash={txHash}
			onResult={(claim) => {
				setVerification(claim);
				router.replace("/pay/external/verified");
			}}
			onError={(message) => {
				setErrorMessage(message);
				router.replace("/pay/external/failed");
			}}
		/>
	);
}
