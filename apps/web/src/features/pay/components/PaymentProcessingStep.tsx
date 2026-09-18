"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useSendMoney } from "@/features/send/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { formatUsdc } from "@/lib/currency";
import type { PublicPaymentLinkData, SendMoneyResponseData } from "@/lib/api/types";

interface PaymentProcessingStepProps {
	link: PublicPaymentLinkData;
	pin: string;
	onSuccess: (result: SendMoneyResponseData) => void;
	onError: (message: string) => void;
}

/** Paying a payment link is just a `POST /transfers/send` in `mode: "wallet"`
 * against the link's own `destinationAddress`, with `memo` (equal to the
 * link's public code) sent as the transfer's `note` so the merchant's ledger
 * can match the deposit back to this link — reuses `useSendMoney` directly
 * rather than duplicating transfer request-building here. `min-h-full`
 * centers it within the page's actual height, same fix as the other
 * transactional flows' processing steps. */
function PaymentProcessingStep({ link, pin, onSuccess, onError }: PaymentProcessingStepProps) {
	const sendMoney = useSendMoney();
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		sendMoney.mutate(
			{
				values: {
					method: "wallet",
					recipient: link.destinationAddress,
					amount: Number(link.amount),
					note: link.memo,
				},
				pin,
			},
			{
				onSuccess: (result) => onSuccess(result),
				onError: (error) =>
					onError(getApiErrorMessage(error, "Payment could not be processed")),
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
				<h2 className="text-s1 text-foreground sm:text-h5">Processing your payment</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					Paying {link.businessName} {formatUsdc(Number(link.amount))} USDC — this only
					takes a moment.
				</p>
			</div>
		</div>
	);
}

export { PaymentProcessingStep };
