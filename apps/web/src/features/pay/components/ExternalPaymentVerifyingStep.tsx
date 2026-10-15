"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useVerifyExternalPayment } from "@/features/pay/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { formatUsdc } from "@/lib/currency";
import type { ExternalPaymentVerificationData, PublicPaymentLinkData } from "@/lib/api/types";

interface ExternalPaymentVerifyingStepProps {
	link: PublicPaymentLinkData;
	senderAddress: string;
	txHash: string;
	onResult: (verification: ExternalPaymentVerificationData) => void;
	onError: (message: string) => void;
}

/** Fires the verification once on mount, same shape as
 * `PaymentProcessingStep`. A transaction that's found but doesn't tally
 * still counts as a result (`needs_reconciliation`), not an error; only
 * a missing or invalid transaction lands in `onError`. */
function ExternalPaymentVerifyingStep({
	link,
	senderAddress,
	txHash,
	onResult,
	onError,
}: ExternalPaymentVerifyingStepProps) {
	const verify = useVerifyExternalPayment();
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		verify.mutate(
			{ link, senderAddress, txHash },
			{
				onSuccess: (result) => onResult(result),
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
