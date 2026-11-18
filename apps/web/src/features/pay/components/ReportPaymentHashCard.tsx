"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { usePublicLinkStatus, useReportPaymentHash } from "@/features/pay/hooks";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api/errorMessage";
import { formatUsdc } from "@/lib/currency";
import type { PublicPaymentLinkData } from "@/lib/api/types";

const HASH_PATTERN = /^[0-9a-fA-F]{64}$/;

/** Human copy for `POST /pay/:code/payment-hash` failures
 * (frontend-integration.md §6.1). */
function describeHashError(error: unknown) {
	const status = getApiErrorStatus(error);
	if (status === 404) return "That transaction isn't on Stellar yet. Wait a few seconds and try again.";
	if (status === 503) return "We couldn't reach Stellar just now. Try again shortly.";
	if (status === 409)
		return getApiErrorMessage(error, "This request was already paid, cancelled, or this hash was already used.");
	return getApiErrorMessage(error, "We couldn't verify that transaction. Check the hash, memo and amount.");
}

/**
 * "I've paid" — for a payer who already sent USDC from their own wallet
 * (with the memo), or whose claim flow hit a glitch. They paste the
 * transaction hash; the server verifies it on Stellar and the request
 * settles once the ledger credit lands, which this card then follows.
 */
function ReportPaymentHashCard({
	link,
	title = "Already paid?",
	onPaid,
}: {
	link: PublicPaymentLinkData;
	title?: string;
	onPaid?: () => void;
}) {
	const [hash, setHash] = useState("");
	const [error, setError] = useState<string | null>(null);
	const report = useReportPaymentHash();
	const reported = report.isSuccess;
	const { data: live } = usePublicLinkStatus(link, reported && report.data?.status !== "matched");
	const paid = report.data?.status === "matched" || live?.status === "paid";
	const valid = HASH_PATTERN.test(hash.trim());

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!valid) return;
		setError(null);
		report.mutate(
			{ link, hash },
			{ onError: (err) => setError(describeHashError(err)) },
		);
	}

	if (paid) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-2xl border border-success-200 bg-success-50 p-5 text-center sm:p-6">
				<CheckCircle2 className="size-8 text-success-600" aria-hidden="true" />
				<p className="text-b2 font-semibold text-foreground">Payment confirmed</p>
				<p className="text-c1 text-muted-foreground sm:text-b3">
					{link.businessName} has received your payment of {formatUsdc(Number(link.amount))} {link.currency}.
				</p>
				{onPaid && (
					<Button type="button" size="large" className="w-full" onClick={onPaid}>
						Done
					</Button>
				)}
			</div>
		);
	}

	if (reported) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background p-5 text-center sm:p-6">
				<Loader2 className="size-8 animate-spin text-primary-600" aria-hidden="true" />
				<p className="text-b2 font-semibold text-foreground">Transaction verified — confirming</p>
				<p className="text-c1 text-muted-foreground sm:text-b3">
					Your payment was found on Stellar. It usually settles within a few seconds.
				</p>
			</div>
		);
	}

	return (
		<form
			noValidate
			onSubmit={handleSubmit}
			className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6"
		>
			<div className="flex flex-col gap-1">
				<h2 className="text-b2 font-semibold text-foreground sm:text-b1">{title}</h2>
				<p className="text-c1 text-muted-foreground sm:text-b3">
					If you&apos;ve already sent {formatUsdc(Number(link.amount))} {link.currency} with the memo <strong>{link.memo}</strong>,
					paste the transaction hash from your wallet and we&apos;ll confirm it.
				</p>
			</div>
			<Input
				value={hash}
				onChange={(e) => setHash(e.target.value)}
				placeholder="64-character transaction hash"
				aria-label="Stellar transaction hash"
				aria-invalid={hash.length > 0 && !valid}
				autoComplete="off"
				spellCheck={false}
			/>
			{hash.length > 0 && !valid && (
				<p className="text-c1 text-destructive">A transaction hash is 64 letters and numbers (0-9, a-f).</p>
			)}
			{error && <Alert variant="error">{error}</Alert>}
			<Button type="submit" variant="outline" size="large" disabled={!valid} loading={report.isPending}>
				I&apos;ve paid — verify my transaction
			</Button>
		</form>
	);
}

export { ReportPaymentHashCard };
