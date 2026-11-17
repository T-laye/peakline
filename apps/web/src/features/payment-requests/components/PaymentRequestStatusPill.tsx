import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type { PaymentRequestStatus } from "@/lib/api/types";

// Maps onto the fixed payment-state tokens (CLAUDE.md): Pending→warning,
// Processing→info, Paid→success, Expired/Flagged→danger, Cancelled→neutral.
// The mocks label unpaid requests "Active"; we use the brief's "Pending" so
// the pill matches the "Pending requests" stat card above the table.
const STATUS_BADGE: Record<
	PaymentRequestStatus,
	{ variant: "pending" | "processing" | "completed" | "failed" | "cancelled"; dot: string; label: string }
> = {
	pending: { variant: "pending", dot: "bg-warning-600", label: "Pending" },
	processing: { variant: "processing", dot: "bg-info-600", label: "Processing" },
	paid: { variant: "completed", dot: "bg-success-600", label: "Paid" },
	expired: { variant: "failed", dot: "bg-danger-600", label: "Expired" },
	cancelled: { variant: "cancelled", dot: "bg-neutral-400", label: "Cancelled" },
	flagged: { variant: "failed", dot: "bg-danger-600", label: "Flagged" },
};

const PAYMENT_REQUEST_STATUS_OPTIONS = (
	Object.keys(STATUS_BADGE) as PaymentRequestStatus[]
).map((value) => ({ value, label: STATUS_BADGE[value].label }));

function PaymentRequestStatusPill({ status }: { status: PaymentRequestStatus }) {
	const badge = STATUS_BADGE[status];
	return (
		<Badge variant={badge.variant}>
			<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
			{badge.label}
		</Badge>
	);
}

/** "12 Aug 2026". */
function formatRequestDate(iso: string | null | undefined) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export { PaymentRequestStatusPill, PAYMENT_REQUEST_STATUS_OPTIONS, formatRequestDate };
