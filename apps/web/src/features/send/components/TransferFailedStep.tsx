"use client";

import { X, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { formatUsdc } from "@/lib/currency";

interface TransferFailedStepProps {
	amount: number;
	errorMessage: string;
	onTryAgain: () => void;
	onGoToDashboard: () => void;
}

/** Step 4b — no reference mock for this one; mirrors `FundingFailedStep`'s
 * layout (same icon-badge + message + card + actions shape), including the
 * `min-h-full` + `justify-center` vertical-centering fix (see
 * `TransferSuccessStep`'s note). `errorMessage` is the real backend failure
 * reason (`getApiErrorMessage`'s output) rather than a fixed line — a
 * failed send can mean several different real things now (insufficient
 * balance, invalid recipient, `PIN_NOT_SET`, ...), not just a coin-flip. */
function TransferFailedStep({
	amount,
	errorMessage,
	onTryAgain,
	onGoToDashboard,
}: TransferFailedStepProps) {
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
				<h2 className="text-s1 text-foreground sm:text-h5">Transfer Failed</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					We couldn&apos;t send {formatUsdc(amount)} USDC. Your balance hasn&apos;t
					been charged.
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

export { TransferFailedStep };
