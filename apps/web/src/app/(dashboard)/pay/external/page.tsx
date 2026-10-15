"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@repo/ui/sonner";
import { ExternalPayStepHeader } from "@/features/pay/components/ExternalPayStepHeader";
import { ExternalWalletAddressStep } from "@/features/pay/components/ExternalWalletAddressStep";
import { useCreatePaymentClaim } from "@/features/pay/hooks";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

export default function ExternalWalletPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const senderAddress = usePayFlowStore((state) => state.externalSenderAddress);
	const claimId = usePayFlowStore((state) => state.externalClaimId);
	const setExternalClaim = usePayFlowStore((state) => state.setExternalClaim);
	const createClaim = useCreatePaymentClaim();

	// Reached without a payment link looked up in this session — send back.
	useEffect(() => {
		if (!link) router.replace("/pay");
	}, [link, router]);

	if (!link) return null;

	function handleContinue(address: string) {
		if (!link) return;
		// Back here from step 2 with the same address — that claim is still
		// good, no need to register another.
		if (claimId && address === senderAddress) {
			router.push("/pay/external/transaction");
			return;
		}
		createClaim.mutate(
			{ link, fromAddress: address },
			{
				onSuccess: (claim) => {
					setExternalClaim(address, claim.id);
					router.push("/pay/external/transaction");
				},
				onError: (err) =>
					toast.error(getApiErrorMessage(err, "Couldn't register your wallet — please try again")),
			},
		);
	}

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<ExternalPayStepHeader step={1} onBack={() => router.push("/pay")} />
			<ExternalWalletAddressStep
				link={link}
				defaultAddress={senderAddress}
				loading={createClaim.isPending}
				onContinue={handleContinue}
			/>
		</div>
	);
}
