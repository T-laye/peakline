"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@repo/ui/sonner";
import { ExternalPaymentFailedStep } from "@/features/pay/components/ExternalPaymentFailedStep";
import { useCreatePaymentClaim } from "@/features/pay/hooks";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

export default function ExternalPaymentFailedPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const errorMessage = usePayFlowStore((state) => state.errorMessage);
	const senderAddress = usePayFlowStore((state) => state.externalSenderAddress);
	const setExternalClaim = usePayFlowStore((state) => state.setExternalClaim);
	const discardExternalClaim = usePayFlowStore((state) => state.discardExternalClaim);
	const reset = usePayFlowStore((state) => state.reset);
	const createClaim = useCreatePaymentClaim();

	useEffect(() => {
		if (!link || !errorMessage) router.replace("/pay");
	}, [link, errorMessage, router]);

	if (!link || !errorMessage) return null;

	// A failed claim can't be verified again — the backend wants a fresh
	// one — so retrying registers a new claim for the same wallet first.
	function handleTryAgain() {
		if (!link || !senderAddress) {
			router.push("/pay/external");
			return;
		}
		createClaim.mutate(
			{ link, fromAddress: senderAddress },
			{
				onSuccess: (claim) => {
					setExternalClaim(senderAddress, claim.id);
					router.push("/pay/external/transaction");
				},
				onError: (err) =>
					toast.error(getApiErrorMessage(err, "Couldn't start a new attempt — please try again")),
			},
		);
	}

	return (
		<ExternalPaymentFailedStep
			link={link}
			errorMessage={errorMessage}
			retrying={createClaim.isPending}
			onTryAgain={handleTryAgain}
			onChangeWallet={() => {
				// So step 1 registers a new claim even if the same address is
				// re-entered, instead of reusing this failed one.
				discardExternalClaim();
				router.push("/pay/external");
			}}
			onGoToDashboard={() => {
				reset();
				router.push("/");
			}}
		/>
	);
}
