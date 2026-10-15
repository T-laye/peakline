"use client";

import { X, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import type { PublicPaymentLinkData } from "@/lib/api/types";

interface ExternalPaymentFailedStepProps {
	link: PublicPaymentLinkData;
	errorMessage: string;
	onTryAgain: () => void;
	onGoToDashboard: () => void;
}

/** The hash couldn't be verified at all (not found, wrong network, etc.).
 * This is not a mismatch; that case goes to reconciliation. Same shape as
 * `PaymentFailedStep`. "Try Again" returns to the hash step with the
 * previous hash pre-filled, since a typo is the likeliest cause. */
function ExternalPaymentFailedStep({
	link,
	errorMessage,
	onTryAgain,
	onGoToDashboard,
}: ExternalPaymentFailedStepProps) {
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
				<h2 className="text-s1 text-foreground sm:text-h5">Verification Failed</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					We couldn&apos;t verify your payment to {link.businessName}.
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

export { ExternalPaymentFailedStep };
