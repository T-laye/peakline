"use client";

import { TriangleAlert } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { CopyableDetailRow } from "@/features/pay/components/CopyableDetailRow";
import { formatUsdc } from "@/lib/currency";
import { truncateMiddle } from "@/lib/pay";
import type {
	ExternalPaymentIssue,
	ExternalPaymentVerificationData,
	PublicPaymentLinkData,
} from "@/lib/api/types";

const ISSUE_LABEL: Record<ExternalPaymentIssue, string> = {
	amount_mismatch: "The amount received doesn't match the amount requested",
	memo_mismatch: "The memo is missing or doesn't match this payment link",
	destination_mismatch: "The payment was sent to a different wallet address",
	sender_mismatch: "The payment came from a different wallet than the one you entered",
	asset_mismatch: "The payment wasn't sent in USDC",
};

function DetailRow({
	label,
	value,
	emphasis,
}: {
	label: string;
	value: string;
	emphasis?: "danger";
}) {
	return (
		<div className="flex items-center justify-between gap-4 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span
				className={
					emphasis === "danger"
						? "font-semibold text-destructive"
						: "font-semibold text-foreground"
				}
			>
				{value}
			</span>
		</div>
	);
}

interface ExternalPaymentReconciliationStepProps {
	link: PublicPaymentLinkData;
	verification: ExternalPaymentVerificationData;
	onContactSupport: () => void;
	onGoToDashboard: () => void;
}

/** The transaction exists on-chain but doesn't tally with the link, so it's
 * been flagged for reconciliation. It isn't rejected and it isn't confirmed.
 * Shows what was expected vs. what arrived, why it was flagged, and a
 * reference to quote to support. Pending → warning, per the payment-state
 * token mapping. */
function ExternalPaymentReconciliationStep({
	link,
	verification,
	onContactSupport,
	onGoToDashboard,
}: ExternalPaymentReconciliationStepProps) {
	const expected = Number(verification.expectedAmount);
	const received = Number(verification.receivedAmount);
	const difference = received - expected;

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 py-2 text-center sm:py-4">
			<span className="flex size-16 items-center justify-center rounded-full bg-warning-500 sm:size-20">
				<TriangleAlert
					className="size-7 text-white sm:size-9"
					strokeWidth={2.5}
					aria-hidden="true"
				/>
			</span>

			<div className="flex flex-col items-center gap-2">
				<Badge variant="pending">Under Review</Badge>
				<h2 className="text-s1 text-foreground sm:text-h5">Payment Needs Reconciliation</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					We found your transaction, but it doesn&apos;t match this payment link. It&apos;s
					been sent for review. {link.businessName} won&apos;t treat it as paid until
					it&apos;s resolved.
				</p>
			</div>

			<div className="flex w-full flex-col gap-2.5 rounded-xl border border-secondary-300 bg-secondary-100 p-4 text-left sm:gap-3 sm:p-5">
				<DetailRow
					label="Expected"
					value={`${formatUsdc(expected)} ${verification.currency}`}
				/>
				<DetailRow
					label="Received"
					value={`${formatUsdc(received)} ${verification.currency}`}
					emphasis={difference !== 0 ? "danger" : undefined}
				/>
				{difference !== 0 && (
					<DetailRow
						label={difference < 0 ? "Short by" : "Overpaid by"}
						value={`${formatUsdc(Math.abs(difference))} ${verification.currency}`}
						emphasis="danger"
					/>
				)}
			</div>

			{verification.issues.length > 0 && (
				<div className="flex w-full flex-col gap-2 rounded-xl border border-warning-200 bg-warning-50 p-4 text-left sm:p-5">
					<span className="text-c1 font-semibold text-warning-900 sm:text-b4">
						Why it was flagged
					</span>
					<ul className="flex list-disc flex-col gap-1 pl-5 text-c1 text-warning-900 sm:text-b4">
						{verification.issues.map((issue) => (
							<li key={issue}>{ISSUE_LABEL[issue]}</li>
						))}
					</ul>
				</div>
			)}

			<div className="flex w-full flex-col gap-4 rounded-xl border border-border p-4 text-left sm:p-5">
				{verification.reconciliationReference && (
					<CopyableDetailRow
						label="Reference"
						value={verification.reconciliationReference}
					/>
				)}
				<CopyableDetailRow
					label="Transaction hash"
					value={truncateMiddle(verification.stellarTxHash, 10, 10)}
					copyValue={verification.stellarTxHash}
				/>
			</div>

			<div className="flex w-full flex-col items-center gap-4">
				<Button type="button" size="large" className="w-full" onClick={onGoToDashboard}>
					Go to Dashboard
				</Button>
				<button
					type="button"
					onClick={onContactSupport}
					className="text-b4 font-medium text-foreground hover:underline sm:text-b3"
				>
					Contact Support
				</button>
			</div>
		</div>
	);
}

export { ExternalPaymentReconciliationStep };
