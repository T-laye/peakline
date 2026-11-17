"use client";

import Link from "next/link";
import { Copy, SearchX } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import {
	displayReconciliationStatus,
	reconciliationDifference,
	reconciliationExpectedAmount,
	reconciliationMethodLabel,
	reconciliationRequestId,
	reconciliationTitle,
	RECONCILIATION_STATUS_BADGE,
} from "@/lib/reconciliation";
import { STATUS_LABEL, formatTransactionDate } from "@/lib/transactions";
import { formatUsdc } from "@/lib/currency";
import { stellarExplorerUrl } from "@/lib/stellar";
import { useReconciliationRecord } from "@/features/merchant/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

const DOT_CLASS: Record<string, string> = {
	completed: "bg-success-600",
	failed: "bg-danger-600",
	pending: "bg-warning-600",
};

const OUTCOME_MESSAGE: Record<ReturnType<typeof displayReconciliationStatus>, string> = {
	matched: "This payment was confirmed and matched to its request — fully reconciled.",
	unmatched: "This payment was confirmed, but no matching request was found for it.",
	amount_mismatch:
		"The payment is confirmed and credited to your wallet, but the amount received differs from what was requested.",
	failed: "This payment attempt failed and was never credited.",
	pending: "This payment hasn't settled yet — there's nothing to reconcile until it does.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-2">
			<h2 className="text-b2 font-medium text-foreground sm:text-b1">{title}</h2>
			<div className="flex flex-col">{children}</div>
		</section>
	);
}

function FieldRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: React.ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-2.5 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className={cn("truncate font-semibold text-foreground", valueClassName)}>{value}</span>
		</div>
	);
}

function CopyField({ label, value }: { label: string; value: string }) {
	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(value);
			toast.success("Copied");
		} catch {
			toast.error("Couldn't copy");
		}
	}
	return (
		<div className="flex items-center justify-between gap-4 py-2.5 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			{/* `min-w-0` lets a 64-char hash truncate instead of overflowing. */}
			<button
				type="button"
				onClick={handleCopy}
				aria-label={`Copy ${label}`}
				className="flex min-w-0 items-center gap-1.5 font-medium text-foreground hover:text-primary-600"
			>
				<span className="truncate">{value}</span>
				<Copy className="size-4 shrink-0" aria-hidden="true" />
			</button>
		</div>
	);
}

/**
 * Reconciliation's own detail page — real data throughout, adjusted from
 * the mock where real fields don't exist:
 * - No "Customer Reference" exists on either match object (confirmed live:
 *   `ReconciliationPaymentLinkData` has no `customerReference` field at
 *   all) — omitted rather than shown blank.
 * - No "Merchant Wallet" field exists on this endpoint (it would need a
 *   separate business/wallet lookup this page doesn't otherwise need) —
 *   omitted rather than guessed.
 * - "Sender Wallet" uses the real `externalAddress` field (the mock's own
 *   version showed the request title there by mistake).
 * - "Reconciliation Outcome" is a real message derived from the actual
 *   status, not placeholder copy.
 * - "Request another payment" (v3 mock) only shows when the customer
 *   underpaid — the only case where collecting more makes sense.
 */
function ReconciliationDetail({ txId }: { txId: string }) {
	const { data: record, isLoading, isError, error } = useReconciliationRecord(txId);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-16 w-full rounded-2xl" />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Skeleton className="h-64 w-full rounded-2xl" />
					<Skeleton className="h-64 w-full rounded-2xl" />
				</div>
			</div>
		);
	}

	if (isError || !record) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="Reconciliation record not found"
					description={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
				/>
			</div>
		);
	}

	const displayStatus = displayReconciliationStatus(record);
	const badge = RECONCILIATION_STATUS_BADGE[displayStatus];
	const expected = reconciliationExpectedAmount(record);
	const received = Number(record.amount);
	const difference = reconciliationDifference(record);
	const requestId = reconciliationRequestId(record);
	const txRef = record.stellarTxHash ?? record.transactionId;

	const underpaid = difference !== null && difference < 0;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-col gap-1">
						<h1 className="text-h5 text-foreground sm:text-h4">Reconciliation Details</h1>
						<span className="text-b3 text-muted-foreground sm:text-b2">
							{requestId ? `Request ID: #${requestId}` : reconciliationTitle(record)}
						</span>
					</div>
					<Badge variant={badge.variant} className="self-start">
						<span className={cn("size-1.5 rounded-full", DOT_CLASS[badge.variant])} aria-hidden="true" />
						{badge.label}
					</Badge>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-12">
					<Section title="Payment Information">
						<FieldRow label="Transaction Type" value="Payment" />
						{requestId && <FieldRow label="Request ID" value={`#${requestId}`} />}
						<FieldRow label="Payment Method" value={reconciliationMethodLabel(record)} />
						{record.paymentLink && <FieldRow label="Request Title" value={record.paymentLink.title} />}
						{expected && (
							<FieldRow label="Expected Amount" value={`${formatUsdc(Number(expected))} USDC`} />
						)}
						<FieldRow label="Request Created" value={formatTransactionDate(record.createdAt)} />
					</Section>

					<Section title="Received Payment">
						<FieldRow label="Received Amount" value={`${formatUsdc(received)} ${record.currency}`} />
						{difference !== null && (
							<FieldRow
								label={difference < 0 ? "Short By" : difference > 0 ? "Overpaid By" : "Difference"}
								value={`${formatUsdc(Math.abs(difference))} ${record.currency}`}
								valueClassName={difference !== 0 ? "text-destructive" : undefined}
							/>
						)}
						<FieldRow
							label="Payment Status"
							value={STATUS_LABEL[record.status]}
							valueClassName={record.status === "completed" ? "text-success-700" : undefined}
						/>
						<FieldRow
							label="Payment Date"
							value={record.completedAt ? formatTransactionDate(record.completedAt) : "—"}
						/>
					</Section>

					<Section title="Transaction Information">
						<CopyField label="Transaction Hash" value={txRef} />
						<FieldRow label="Network" value="Stellar Testnet" />
						{record.externalAddress && (
							<FieldRow
								label="Sender Wallet"
								value={<span className="max-w-40 truncate sm:max-w-none">{record.externalAddress}</span>}
							/>
						)}
					</Section>

					<Section title="Reconciliation Outcome">
						<p className="mb-2 rounded-xl bg-primary-100/60 p-4 text-c1 text-muted-foreground sm:text-b3">
							{OUTCOME_MESSAGE[displayStatus]}
							{displayStatus === "amount_mismatch" && difference !== null && difference !== 0 && (
								<>
									{" "}
									{difference < 0
										? `The customer underpaid by ${formatUsdc(-difference)} ${record.currency}. Request the balance from them.`
										: `The customer overpaid by ${formatUsdc(difference)} ${record.currency}. You may want to refund the extra.`}
								</>
							)}
						</p>
						<CopyField label="Transaction ID" value={record.transactionId} />
						{record.stellarTxHash && (
							<FieldRow
								label="Stellar Explorer Link"
								value={
									<a
										href={stellarExplorerUrl(record.stellarTxHash)}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-info-600 hover:underline"
									>
										explorer link
									</a>
								}
							/>
						)}
					</Section>
				</div>
			</div>

			{/* c7: an underpaid request needs the balance collected — start a
			    new payment request for it. */}
			{underpaid && (
				<Button asChild size="large" className="w-full">
					<Link href="/payment-requests/create">Request another payment</Link>
				</Button>
			)}
		</div>
	);
}

export { ReconciliationDetail };
