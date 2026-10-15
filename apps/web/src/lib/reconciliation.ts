import type { ReconciliationData } from "@/lib/api/types";

/** A real reconciliation status only ever needs three of `Badge`'s variants
 * — `completed`/`failed`/`pending` — narrower than `Badge`'s own full
 * variant union (which also has `default`/`secondary`/`outline`) and than
 * `StatusBadge`'s `PaymentStatus` (which adds `reversed`, not a variant
 * `Badge` itself actually accepts). */
type ReconciliationBadgeVariant = "completed" | "failed" | "pending";

/** The table/detail "Payment Method" column isn't a literal API field — the
 * real `method` enum on a transaction is `intent | stellar | peakline |
 * bank | conversion` (confirmed live), none of which read "Payment Link" or
 * "QR" directly. Derived instead from which match object is populated:
 * `fundingIntent` set means it arrived via a scanned QR (`method: intent`
 * is literally documented as "renders as QR on the client"); `paymentLink`
 * set means a payment link. Neither means an unmatched/direct deposit with
 * no request behind it at all. */
function reconciliationMethodLabel(record: ReconciliationData): string {
	if (record.paymentLink) return "Payment Link";
	if (record.fundingIntent) return "QR";
	return "Direct Deposit";
}

/** "Request ID" as shown across Payments/Reconciliation — the payment
 * link's own short `publicCode`, or the funding intent's `memo` (the
 * Stellar text memo a QR payer's wallet actually attaches, so it's the one
 * identifier that's real for a QR-received deposit too). `null` when
 * neither exists (a direct/unmatched deposit has no request to name). */
function reconciliationRequestId(record: ReconciliationData): string | null {
	return record.paymentLink?.publicCode ?? record.fundingIntent?.memo ?? null;
}

/** "Title" — only a payment link carries one (`ReconciliationFundingIntentDto`
 * has no title field at all, confirmed live) — falls back to the method
 * label rather than leaving the column blank for a QR/direct row. */
function reconciliationTitle(record: ReconciliationData): string {
	return record.paymentLink?.title ?? reconciliationMethodLabel(record);
}

/** The amount the payer was actually expected to send — only known at all
 * when matched to a payment link or funding intent, both of which carry
 * their own `expectedAmount`. `null` for an unmatched/direct deposit, which
 * was never tied to a specific expected amount to begin with. */
function reconciliationExpectedAmount(record: ReconciliationData): string | null {
	return record.paymentLink?.expectedAmount ?? record.fundingIntent?.expectedAmount ?? null;
}

/** Received minus expected — negative = the customer underpaid, positive =
 * overpaid. `null` when there was no expected amount to compare against.
 * Signed rather than absolute: the merchant's next step is opposite in
 * each case (collect the rest vs. refund the extra), and an external-wallet
 * claim settles either way (see `PaymentLinkClaimData`). */
function reconciliationDifference(record: ReconciliationData): number | null {
	const expected = reconciliationExpectedAmount(record);
	if (expected === null) return null;
	return Number(record.amount) - Number(expected);
}

/** A unified status for display — `reconciliationStatus` only gets a real
 * verdict once the underlying transaction actually completes; before that
 * there's nothing to show but the transaction's own in-flight `status`.
 * Not a 5th value of the real `reconciliationStatus` enum, just how this
 * app chooses to render the "not resolved yet" case. */
type DisplayReconciliationStatus = "matched" | "unmatched" | "amount_mismatch" | "failed" | "pending";

function displayReconciliationStatus(record: ReconciliationData): DisplayReconciliationStatus {
	if (record.status !== "completed" && record.status !== "failed") return "pending";
	return record.reconciliationStatus;
}

const STATUS_BADGE: Record<
	DisplayReconciliationStatus,
	{ variant: ReconciliationBadgeVariant; label: string }
> = {
	matched: { variant: "completed", label: "Matched" },
	unmatched: { variant: "failed", label: "Unmatched" },
	amount_mismatch: { variant: "pending", label: "Mismatched" },
	failed: { variant: "failed", label: "Failed" },
	pending: { variant: "pending", label: "Pending" },
};

export {
	reconciliationMethodLabel,
	reconciliationRequestId,
	reconciliationTitle,
	reconciliationExpectedAmount,
	reconciliationDifference,
	displayReconciliationStatus,
	STATUS_BADGE as RECONCILIATION_STATUS_BADGE,
};
export type { DisplayReconciliationStatus };
