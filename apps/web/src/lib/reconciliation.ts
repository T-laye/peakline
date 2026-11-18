import type { ReconciliationData, ReconciliationStatus, ReconciliationTransactionType } from "@/lib/api/types";

type ReconciliationBadgeVariant = "completed" | "failed" | "pending" | "processing" | "cancelled";

/** v3 `reconciliationStatus` → pill. `flagged`/`amount_mismatch` are open
 * review flags (warning), `reviewed` is a resolved one (neutral), `pending`
 * is a refund still in flight (info). */
const STATUS_BADGE: Record<ReconciliationStatus, { variant: ReconciliationBadgeVariant; dot: string; label: string }> = {
	matched: { variant: "completed", dot: "bg-success-600", label: "Matched" },
	unmatched: { variant: "failed", dot: "bg-danger-600", label: "Unmatched" },
	flagged: { variant: "pending", dot: "bg-warning-600", label: "Flagged" },
	amount_mismatch: { variant: "pending", dot: "bg-warning-600", label: "Mismatched" },
	failed: { variant: "failed", dot: "bg-danger-600", label: "Failed" },
	pending: { variant: "processing", dot: "bg-info-600", label: "Pending" },
	reviewed: { variant: "cancelled", dot: "bg-neutral-400", label: "Reviewed" },
};

const TYPE_LABEL: Record<ReconciliationTransactionType, string> = {
	payment: "Payment",
	refund: "Refund",
	unmatched_payment: "Uncredited payment",
};

const REFUND_STATUS_LABEL: Record<string, string> = {
	pending: "Not refunded",
	partially_refunded: "Partially refunded",
	refunded: "Refunded",
	requested: "Requested",
	authorized: "Authorized",
	processing: "Processing",
	completed: "Completed",
	failed: "Failed",
};

function refundStatusLabel(status: string | null | undefined) {
	if (!status) return null;
	return REFUND_STATUS_LABEL[status] ?? status;
}

function shortAddress(address: string) {
	return address.length > 12 ? `${address.slice(0, 5)}...${address.slice(-5)}` : address;
}

/** Customer name/email when the payment settled a customer request, else the
 * payer (or refund recipient) wallet, shortened. */
function reconciliationCustomerLabel(record: ReconciliationData) {
	if (record.customerName) return record.customerName;
	if (record.customerEmail) return record.customerEmail;
	if (record.counterpartyAddress) return shortAddress(record.counterpartyAddress);
	return "—";
}

/** Statuses with an open review flag the merchant can resolve. */
function needsReview(record: ReconciliationData) {
	return record.reconciliationStatus === "flagged" || record.reconciliationStatus === "amount_mismatch";
}

export {
	STATUS_BADGE as RECONCILIATION_STATUS_BADGE,
	TYPE_LABEL as RECONCILIATION_TYPE_LABEL,
	refundStatusLabel,
	reconciliationCustomerLabel,
	shortAddress,
	needsReview,
};
