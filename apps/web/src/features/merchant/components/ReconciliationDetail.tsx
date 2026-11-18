"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, SearchX } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import {
	RECONCILIATION_STATUS_BADGE,
	RECONCILIATION_TYPE_LABEL,
	needsReview,
	refundStatusLabel,
} from "@/lib/reconciliation";
import { STATUS_LABEL, formatTransactionDate } from "@/lib/transactions";
import { formatUsdc } from "@/lib/currency";
import { stellarExplorerUrl } from "@/lib/stellar";
import { describeFlagReason } from "@/lib/stellarIssues";
import {
	useMerchantPaymentLink,
	useOpenFlagFor,
	useReconciliationRecord,
	useResolveFlag,
} from "@/features/merchant/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { ReconciliationData, ReconciliationStatus } from "@/lib/api/types";

const OUTCOME_MESSAGE: Record<ReconciliationStatus, string> = {
	matched: "This record is tied to its request or confirmed payout — fully reconciled.",
	unmatched: "This payment was confirmed, but no matching request was found for it.",
	flagged: "This payment needs manual review before it can be considered reconciled.",
	amount_mismatch:
		"The payment is confirmed and credited to your wallet, but the amount received differs from what was requested.",
	failed: "This attempt failed and was never credited.",
	pending: "This refund is still in flight. It reconciles once Stellar confirms it.",
	reviewed: "This flagged payment was reviewed and resolved.",
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

/** "Mark as reviewed" — resolves the open flag behind a flagged payment
 * (`POST /payment-links/flags/{flagId}/resolve`). */
function ResolveFlagForm({ record }: { record: ReconciliationData }) {
	const { data: flag, isLoading } = useOpenFlagFor(record);
	const resolveFlag = useResolveFlag();
	const [note, setNote] = useState("");

	if (isLoading) return <Skeleton className="h-11 w-full" />;
	if (!flag) return null;

	function handleResolve() {
		if (!flag || note.trim().length < 3) return;
		resolveFlag.mutate(
			{ flagId: flag.id, note: note.trim() },
			{
				onSuccess: () => toast.success("Marked as reviewed"),
				onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't resolve this flag")),
			},
		);
	}

	return (
		<div className="flex flex-col gap-2 pt-2">
			<span className="text-c1 text-muted-foreground sm:text-b3">Flag reason: {describeFlagReason(flag.reason)}</span>
			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder="Review note, e.g. customer confirmed by phone"
					aria-label="Review note"
				/>
				<Button
					type="button"
					variant="outline"
					onClick={handleResolve}
					disabled={note.trim().length < 3}
					loading={resolveFlag.isPending}
					className="shrink-0"
				>
					Mark as reviewed
				</Button>
			</div>
		</div>
	);
}

/**
 * Reconciliation Details (v3 mock + v3 API). Request title and expected
 * amount come from the linked payment request when there is one; the
 * record itself carries customer, references, statuses and addresses.
 * Actions: resolve an open review flag, request the shortfall when the
 * customer underpaid, or start a refund for a payment.
 */
function ReconciliationDetail({ reference }: { reference: string }) {
	const { data: record, isLoading, isError, error } = useReconciliationRecord(reference);
	const { data: request } = useMerchantPaymentLink(record?.paymentRequestId ?? "");

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-16 w-full rounded-2xl" />
				<Skeleton className="h-80 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !record) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="Reconciliation record not found"
					description={getApiErrorMessage(error, "It may have been removed, or the reference is wrong.")}
				/>
			</div>
		);
	}

	const badge = RECONCILIATION_STATUS_BADGE[record.reconciliationStatus];
	const received = Number(record.amount);
	const expected = request ? Number(request.amount) : null;
	const isPayment = record.transactionType === "payment";
	const difference = expected !== null && isPayment ? received - expected : null;
	const canRefund = isPayment && record.paymentStatus === "completed" && record.refundStatus !== "refunded";
	const underpaid = difference !== null && difference < 0;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-col gap-1">
						<h1 className="text-h5 text-foreground sm:text-h4">Reconciliation Details</h1>
						<span className="text-b3 text-muted-foreground sm:text-b2">
							{record.paymentReference
								? `Request ID: #${record.paymentReference}`
								: RECONCILIATION_TYPE_LABEL[record.transactionType]}
						</span>
					</div>
					<Badge variant={badge.variant} className="self-start">
						<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
						{badge.label}
					</Badge>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-12">
					<Section title="Payment Information">
						<FieldRow label="Transaction Type" value={RECONCILIATION_TYPE_LABEL[record.transactionType]} />
						{record.paymentReference && <FieldRow label="Request ID" value={`#${record.paymentReference}`} />}
						{record.customerReference && <FieldRow label="Customer Reference" value={record.customerReference} />}
						{(record.customerName || record.customerEmail) && (
							<FieldRow label="Customer" value={record.customerName ?? record.customerEmail} />
						)}
						<FieldRow
							label="Payment Method"
							value={request ? (request.kind === "request" ? "Request Link" : "Payment Link") : "Direct transfer"}
						/>
						{request && <FieldRow label="Request Title" value={request.title} />}
						{expected !== null && <FieldRow label="Expected Amount" value={`${formatUsdc(expected)} USDC`} />}
						{request && <FieldRow label="Request Created" value={formatTransactionDate(request.createdAt)} />}
					</Section>

					<Section title={isPayment ? "Received Payment" : RECONCILIATION_TYPE_LABEL[record.transactionType]}>
						<FieldRow
							label={record.transactionType === "refund" ? "Refund Amount" : "Received Amount"}
							value={`${formatUsdc(received)} ${record.asset}`}
						/>
						{difference !== null && (
							<FieldRow
								label={difference < 0 ? "Short By" : difference > 0 ? "Overpaid By" : "Difference"}
								value={`${formatUsdc(Math.abs(difference))} ${record.asset}`}
								valueClassName={difference !== 0 ? "text-destructive" : undefined}
							/>
						)}
						{record.paymentStatus && (
							<FieldRow
								label="Payment Status"
								value={STATUS_LABEL[record.paymentStatus]}
								valueClassName={record.paymentStatus === "completed" ? "text-success-700" : undefined}
							/>
						)}
						{refundStatusLabel(record.refundStatus) && (
							<FieldRow label="Refund Status" value={refundStatusLabel(record.refundStatus)} />
						)}
						<FieldRow label="Date" value={formatTransactionDate(record.transactionDate)} />
					</Section>

					<Section title="Transaction Information">
						{record.stellarTxHash && <CopyField label="Transaction Hash" value={record.stellarTxHash} />}
						<FieldRow label="Network" value="Stellar Testnet" />
						{record.counterpartyAddress && (
							<FieldRow
								label={record.transactionType === "refund" ? "Recipient Wallet" : "Sender Wallet"}
								value={<span className="max-w-40 truncate sm:max-w-none">{record.counterpartyAddress}</span>}
							/>
						)}
					</Section>

					<Section title="Reconciliation Outcome">
						<p className="mb-2 rounded-xl bg-primary-100/60 p-4 text-c1 text-muted-foreground sm:text-b3">
							{record.reconciliationStatus === "unmatched" && record.paymentRequestId
								? "This payment arrived for the request above, but it couldn't be matched to it automatically."
								: OUTCOME_MESSAGE[record.reconciliationStatus]}
							{difference !== null && difference !== 0 && (
								<>
									{" "}
									{difference < 0
										? `The customer underpaid by ${formatUsdc(-difference)} ${record.asset}. Request the balance from them.`
										: `The customer overpaid by ${formatUsdc(difference)} ${record.asset}. You may want to refund the extra.`}
								</>
							)}
						</p>
						<CopyField label="Reference" value={record.reference} />
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
						{needsReview(record) && <ResolveFlagForm record={record} />}
					</Section>
				</div>
			</div>

			{(underpaid || canRefund) && (
				<div className="flex flex-col gap-3 sm:flex-row">
					{underpaid && (
						<Button asChild size="large" className="w-full sm:flex-1">
							<Link href="/payment-requests/create">Request another payment</Link>
						</Button>
					)}
					{canRefund && (
						<Button asChild size="large" variant="outline" className="w-full sm:flex-1">
							<Link href={`/refunds/${record.reference}`}>Refund this payment</Link>
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

export { ReconciliationDetail };
