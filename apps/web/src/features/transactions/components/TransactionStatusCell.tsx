import { Badge, StatusBadge } from "@repo/ui/badge";
import { hasAmountMismatch } from "@/lib/transactions";
import type { TransactionData } from "@/lib/api/types";

/** The ledger status, plus a "Mismatched" flag when a payment-link deposit
 * settled for a different amount than requested (see `hasAmountMismatch`).
 * The ledger status alone reads "Completed" for those, which hides that
 * the merchant still has a difference to chase or refund. Same label and
 * Pending→warning treatment Reconciliation uses for `amount_mismatch`. */
function TransactionStatusCell({ transaction }: { transaction: TransactionData }) {
	if (!hasAmountMismatch(transaction)) return <StatusBadge status={transaction.status} />;

	return (
		<div className="flex flex-wrap items-center justify-end gap-1.5 lg:justify-start">
			<StatusBadge status={transaction.status} />
			<Badge variant="pending">Mismatched</Badge>
		</div>
	);
}

export { TransactionStatusCell };
