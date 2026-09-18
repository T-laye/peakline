"use client";

import { useEffect, useRef } from "react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { useFundQuote } from "@/features/wallet/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { formatUsdc } from "@/lib/currency";
import type { FundWalletValues } from "@/lib/validations/walletValidations";
import type { FundQuoteData } from "@/lib/api/types";

function DetailRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
	return (
		<div className="flex items-start justify-between gap-4 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span
				className={muted ? "text-muted-foreground" : "font-semibold text-foreground"}
			>
				{value}
			</span>
		</div>
	);
}

interface ConfirmFundingStepProps {
	values: FundWalletValues;
	onContinue: (quote: FundQuoteData) => void;
}

/** Step 2 — a real `POST /wallets/stellar/fund/quote` preview (fee, net
 * receive amount, live GHS rate), fetched once on arrival, replacing the
 * earlier fake funding-method review (a "From: MTN Mobile Money" row with
 * no real linked account behind it, and a hardcoded "0.00 USDC" fee). No
 * PIN here, unlike Send/Pay's own confirm steps — the real faucet endpoint
 * doesn't ask for one; there's no real money moving from anywhere for a PIN
 * to authorize.
 */
function ConfirmFundingStep({ values, onContinue }: ConfirmFundingStepProps) {
	const fundQuote = useFundQuote();
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		fundQuote.mutate({ amount: values.amount, currency: "USDC" });
		// Intentionally run once on mount — `values`/`fundQuote` stable for
		// the lifetime of this step.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (fundQuote.isError) {
		return (
			<div className="flex flex-col items-center gap-3 py-6 text-center">
				<p className="text-b3 text-destructive">
					{getApiErrorMessage(fundQuote.error, "Couldn't load a funding quote.")}
				</p>
				<Button
					type="button"
					variant="outline"
					onClick={() => fundQuote.mutate({ amount: values.amount, currency: "USDC" })}
				>
					Try Again
				</Button>
			</div>
		);
	}

	if (!fundQuote.data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-24 w-full rounded-xl" />
				<Skeleton className="h-40 w-full rounded-xl" />
			</div>
		);
	}

	const quote = fundQuote.data;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
				<span className="text-c1 text-muted-foreground sm:text-b3">You are funding</span>
				<span className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(Number(quote.amount))} USDC
				</span>
				{quote.fxEquivalent && (
					<span className="text-c1 text-muted-foreground sm:text-b3">
						~ GHS {formatUsdc(Number(quote.fxEquivalent))}
					</span>
				)}
			</div>

			<div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:p-5">
				<DetailRow label="Network" value="Stellar (testnet)" />
				<DetailRow
					label="Exchange Rate"
					value={`1 USDC ≈ GHS ${formatUsdc(Number(quote.fxRate))}`}
					muted
				/>
				<DetailRow label="Fee" value={`${formatUsdc(Number(quote.fee))} USDC`} muted />
				<DetailRow
					label="You will receive"
					value={`${formatUsdc(Number(quote.receiveAmount))} ${quote.receiveCurrency}`}
				/>
			</div>

			<Button type="button" size="large" className="w-full" onClick={() => onContinue(quote)}>
				Continue
			</Button>
		</div>
	);
}

export { ConfirmFundingStep };
