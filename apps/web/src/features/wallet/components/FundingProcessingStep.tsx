"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useFundWallet, useMyWallet } from "@/features/wallet/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { formatUsdc } from "@/lib/currency";
import type { FundQuoteData, FundWalletResultData } from "@/lib/api/types";

interface FundingProcessingStepProps {
	quote: FundQuoteData;
	onSuccess: (result: FundWalletResultData) => void;
	onError: (message: string) => void;
}

/** Step 3 — fires the real faucet deposit on mount and reports back once it
 * settles. `useMyWallet` is re-read here (cheap — same cache the form step
 * already populated) rather than threading the address through props/store,
 * same "just re-fetch it" pattern `useWalletBalance` gets everywhere else.
 * No back button and no close button on the dialog for this step (see
 * `FundWalletDialog`) — a transaction in flight shouldn't be dismissable.
 *
 * `min-h-full` centers the loader within whatever height the mobile page's
 * own container resolves to (the dashboard's `main` stretches via `flex-1`
 * to fill the viewport) — a fixed `vh` fraction used here previously under-
 * or overshot depending on how tall the surrounding chrome actually was.
 * Inside the desktop dialog this has no effect (its container's height is
 * auto/content-sized, so percentage heights resolve to nothing there per
 * spec) — exactly what's wanted, since the dialog was never the problem. */
function FundingProcessingStep({ quote, onSuccess, onError }: FundingProcessingStepProps) {
	const { data: wallet } = useMyWallet();
	const fundWallet = useFundWallet();
	// Guards against React 18/19 StrictMode's double-invoked effects firing
	// this twice in dev, which would otherwise kick off two real deposits.
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		if (!wallet) return;
		started.current = true;
		fundWallet.mutate(
			{ address: wallet.publicKey, amount: quote.receiveAmount },
			{
				onSuccess: (result) => onSuccess(result),
				onError: (error) =>
					onError(getApiErrorMessage(error, "Funding could not be processed")),
			},
		);
		// Intentionally re-checked only while waiting on `wallet` to resolve
		// (it's already cached by this point in the flow, so this fires on
		// the very next render); `quote`/`onSuccess`/`onError`/`fundWallet`
		// are stable for the lifetime of this step.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wallet]);

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 py-6 text-center sm:py-10">
			<Loader2
				className="size-12 animate-spin text-primary-500 sm:size-14"
				aria-hidden="true"
			/>
			<div className="flex flex-col gap-2">
				<h2 className="text-s1 text-foreground sm:text-h5">
					Processing your funding
				</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					Adding {formatUsdc(Number(quote.receiveAmount))} USDC to your wallet — this
					only takes a moment.
				</p>
			</div>
		</div>
	);
}

export { FundingProcessingStep };
