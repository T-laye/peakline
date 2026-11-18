import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type { PaymentLinkStatus } from "@/lib/api/types";

// One lifecycle for reusable links and customer requests (v3 API), mapped
// onto the fixed payment-state tokens (CLAUDE.md): Pending→warning,
// Processing→info, Paid→success, Expired/Flagged→danger, Cancelled→neutral.
const STATUS_BADGE: Record<
	PaymentLinkStatus,
	{ variant: "pending" | "processing" | "completed" | "failed" | "cancelled"; dot: string; label: string }
> = {
	pending: { variant: "pending", dot: "bg-warning-600", label: "Pending" },
	processing: { variant: "processing", dot: "bg-info-600", label: "Processing" },
	paid: { variant: "completed", dot: "bg-success-600", label: "Paid" },
	expired: { variant: "failed", dot: "bg-danger-600", label: "Expired" },
	cancelled: { variant: "cancelled", dot: "bg-neutral-400", label: "Cancelled" },
	flagged: { variant: "failed", dot: "bg-danger-600", label: "Flagged" },
};

export const PAYMENT_LINK_STATUS_OPTIONS = (Object.keys(STATUS_BADGE) as PaymentLinkStatus[]).map(
	(value) => ({ value, label: STATUS_BADGE[value].label }),
);

export const PAYMENT_LINK_STATUS_LABEL = Object.fromEntries(
	Object.entries(STATUS_BADGE).map(([key, badge]) => [key, badge.label]),
) as Record<PaymentLinkStatus, string>;

/** Statuses the API lets a merchant cancel from. */
export const CANCELLABLE_STATUSES: PaymentLinkStatus[] = ["pending", "flagged", "expired"];

export function PaymentLinkStatusPill({ status }: { status: PaymentLinkStatus }) {
	const badge = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
	return (
		<Badge variant={badge.variant}>
			<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
			{badge.label}
		</Badge>
	);
}
