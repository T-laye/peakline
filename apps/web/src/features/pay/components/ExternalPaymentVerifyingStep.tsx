"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useVerifyPaymentClaim } from "@/features/pay/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { formatUsdc } from "@/lib/currency";
import type { PaymentLinkClaimData, PublicPaymentLinkData } from "@/lib/api/types";

interface ExternalPaymentVerifyingStepProps {
	link: PublicPaymentLinkData;
	claimId: string;
	txHash: string;
	onResult: (claim: PaymentLinkClaimData) => void;
	onError: (message: string) => void;
}

/** Submits the hash against the claim once on mount, same shape as
 * `PaymentProcessingStep`. Only a `settled` claim is a success; every
 * failed check comes back as a 400 whose `message` says which one (wrong
 * sender, not USDC, not found on Horizon...), shown as-is on the failed
 * screen. */
function ExternalPaymentVerifyingStep({
	link,
	claimId,
	txHash,
	onResult,
	onError,
}: ExternalPaymentVerifyingStepProps) {
	const verify = useVerifyPaymentClaim();
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		verify.mutate(
			{ link, claimId, txHash },
			{
				onSuccess: (claim) => {
					if (claim.status !== "settled") {
						onError(
							claim.failureReason ||
								"This payment couldn't be confirmed yet. Check the hash and try again.",
						);
						return;
					}
					onResult(claim);
				},
				onError: (error) =>
					onError(
						getApiErrorMessage(
							error,
							"We couldn't find a matching transaction on the Stellar network. Check the hash and try again.",
						),
					),
			},
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 text-center">
			<Loader2
				className="size-12 animate-spin text-primary-500 sm:size-14"
				aria-hidden="true"
			/>
			<div className="flex flex-col gap-2">
				<h2 className="text-s1 text-foreground sm:text-h5">Verifying your payment</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					Checking your {formatUsdc(Number(link.amount))} USDC payment to{" "}
					{link.businessName} on the Stellar network.
				</p>
			</div>
		</div>
	);
}

export { ExternalPaymentVerifyingStep };
