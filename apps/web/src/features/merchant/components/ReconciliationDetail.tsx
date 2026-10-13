"use client";

import { Copy, SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import {
	displayReconciliationStatus,
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
		"The payment is confirmed, but the received amount differs from what was requested. It needs review before it can be considered fully reconciled.",
	failed: "This payment attempt failed and was never credited.",
	pending: "This payment hasn't settled yet — there's nothing to reconcile until it does.",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<h2 className="text-b2 font-semibold text-foreground">{title}</h2>
			<div className="flex flex-col divide-y divide-border">{children}</div>
		</div>
	);
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className="truncate font-semibold text-foreground">{value}</span>
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
	const difference = expected ? Math.abs(Number(expected) - received) : null;
	const requestId = reconciliationRequestId(record);
	const txRef = record.stellarTxHash ?? record.transactionId;

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(txRef);
			toast.success("Copied");
		} catch {
			toast.error("Couldn't copy");
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
				<div className="flex flex-col gap-1">
					<span className="text-b3 text-muted-foreground">
						Request ID: {requestId ?? record.transactionId}
					</span>
					<h1 className="text-h5 text-foreground sm:text-h4">{reconciliationTitle(record)}</h1>
				</div>
				<Badge variant={badge.variant} className="self-start sm:self-auto">
					<span className={cn("size-1.5 rounded-full", DOT_CLASS[badge.variant])} aria-hidden="true" />
					{badge.label}
				</Badge>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<SectionCard title="Payment Information">
					{requestId && <FieldRow label="Request ID" value={requestId} />}
					<FieldRow label="Payment Method" value={reconciliationMethodLabel(record)} />
					{record.paymentLink && (
						<FieldRow label="Request Title" value={record.paymentLink.title} />
					)}
					{expected && (
						<FieldRow label="Expected Amount" value={`${formatUsdc(Number(expected))} USDC`} />
					)}
					<FieldRow label="Request Created" value={formatTransactionDate(record.createdAt)} />
				</SectionCard>

				<SectionCard title="Received Payment">
					<FieldRow label="Received Amount" value={`${formatUsdc(received)} ${record.currency}`} />
					{difference !== null && (
						<FieldRow
							label="Difference"
							value={
								<span className={difference > 0 ? "text-destructive" : undefined}>
									{formatUsdc(difference)} {record.currency}
								</span>
							}
						/>
					)}
					<FieldRow label="Payment Status" value={STATUS_LABEL[record.status]} />
					<FieldRow
						label="Payment Date"
						value={record.completedAt ? formatTransactionDate(record.completedAt) : "—"}
					/>
				</SectionCard>

				<SectionCard title="Transaction Information">
					<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
						<span className="text-muted-foreground">Transaction Hash</span>
						<button
							type="button"
							onClick={handleCopy}
							className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary-600"
						>
							<span className="max-w-40 truncate sm:max-w-none">{txRef}</span>
							<Copy className="size-4 shrink-0" aria-hidden="true" />
						</button>
					</div>
					<FieldRow label="Network" value="Stellar" />
					{record.externalAddress && (
						<FieldRow
							label="Sender Wallet"
							value={
								<span className="max-w-40 truncate sm:max-w-none">{record.externalAddress}</span>
							}
						/>
					)}
				</SectionCard>

				<SectionCard title="Reconciliation Outcome">
					<p className="py-3 text-c1 text-muted-foreground sm:text-b3">
						{OUTCOME_MESSAGE[displayStatus]}
					</p>
					<FieldRow
						label="Transaction ID"
						value={<span className="max-w-40 truncate sm:max-w-none">{record.transactionId}</span>}
					/>
					{record.stellarTxHash && (
						<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
							<span className="text-muted-foreground">Stellar Explorer Link</span>
							<a
								href={stellarExplorerUrl(record.stellarTxHash)}
								target="_blank"
								rel="noopener noreferrer"
								className="font-semibold text-primary-600 hover:underline"
							>
								explorer link
							</a>
						</div>
					)}
				</SectionCard>
			</div>
		</div>
	);
}

export { ReconciliationDetail };
