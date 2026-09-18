"use client";

import { X, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { formatUsdc } from "@/lib/currency";
import type { PublicPaymentLinkData } from "@/lib/api/types";

interface PaymentFailedStepProps {
	link: PublicPaymentLinkData;
	errorMessage: string;
	onTryAgain: () => void;
	onGoToDashboard: () => void;
}

/** No reference mock — mirrors `TransferFailedStep`/`FundingFailedStep`'s
 * shape (icon-badge + message + actions), including the `min-h-full` +
 * `justify-center` vertical-centering fix (see `PaymentSuccessStep`'s note).
 * `errorMessage` is the real backend failure reason, not a fixed line. */
function PaymentFailedStep({
	link,
	errorMessage,
	onTryAgain,
	onGoToDashboard,
}: PaymentFailedStepProps) {
	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 py-2 text-center sm:py-4">
			<span className="flex size-16 items-center justify-center rounded-full bg-destructive sm:size-20">
				<X
					className="size-7 text-destructive-foreground sm:size-9"
					strokeWidth={3}
					aria-hidden="true"
				/>
			</span>

			<div className="flex flex-col gap-2">
				<h2 className="text-s1 text-foreground sm:text-h5">Payment Failed</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					We couldn&apos;t pay {link.businessName} {formatUsdc(Number(link.amount))} USDC.
					Your balance hasn&apos;t been charged.
				</p>
				<p className="text-b4 text-muted-foreground sm:text-b3">{errorMessage}</p>
			</div>

			<div className="flex w-full flex-col items-center gap-4">
				<Button type="button" size="large" className="w-full" onClick={onTryAgain}>
					<RefreshCw className="size-4" aria-hidden="true" />
					Try Again
				</Button>
				<button
					type="button"
					onClick={onGoToDashboard}
					className="text-b4 font-medium text-foreground hover:underline sm:text-b3"
				>
					Go to Dashboard
				</button>
			</div>
		</div>
	);
}

export { PaymentFailedStep };
