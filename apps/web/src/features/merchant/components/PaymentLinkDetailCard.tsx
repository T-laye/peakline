"use client";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { useCancelPaymentLink } from "@/features/merchant/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { toast } from "@repo/ui/sonner";
import type { PaymentLinkData, PaymentLinkStatus } from "@/lib/api/types";

// Same dot+pill mapping as `PaymentLinksTable`'s own `STATUS_BADGE` — kept
// as a separate copy rather than a shared export since each file's status
// pill sits in a different visual context (a table cell vs. this card's
// centered header) even though the color logic is identical. No "paid"
// state on the real API — see `PaymentLinkStatus`'s own comment.
const STATUS_BADGE: Record<
	PaymentLinkStatus,
	{ variant: "completed" | "failed" | "cancelled"; dot: string; label: string }
> = {
	active: { variant: "completed", dot: "bg-success-600", label: "Active" },
	expired: { variant: "failed", dot: "bg-danger-600", label: "Expired" },
	cancelled: { variant: "cancelled", dot: "bg-neutral-400", label: "Cancelled" },
};

function formatLinkDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-semibold text-foreground">{value}</span>
		</div>
	);
}

/**
 * The left-hand receipt-style card on a Payment Link's own detail page —
 * title + status badge centered, then the same secondary/gold amount-box
 * treatment `TransactionDetail` uses for its own amount, then Expiration
 * Date/Description as plain detail rows. Its own component rather than
 * `TransactionDetail` reused — a payment link isn't a `Transaction` (no
 * counterparty, no status banner icon, no transaction id).
 */
function PaymentLinkDetailCard({ link }: { link: PaymentLinkData }) {
	const badge = STATUS_BADGE[link.status];
	const amount = Number(link.amount);
	const cancelLink = useCancelPaymentLink();

	function handleCancel() {
		cancelLink.mutate(link.id, {
			onError: (error) =>
				toast.error(getApiErrorMessage(error, "Couldn't cancel this payment link.")),
		});
	}

	return (
		<div className="flex flex-col gap-5 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 sm:p-8">
			<div className="flex flex-col items-center gap-3 text-center">
				<h2 className="text-s1 text-foreground sm:text-h5">{link.title}</h2>
				<Badge variant={badge.variant}>
					<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
					{badge.label}
				</Badge>
			</div>

			<div className="flex flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
				<span className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {link.currency}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</span>
			</div>

			<div className="flex flex-col divide-y divide-secondary-300 border-t border-secondary-300">
				<DetailRow label="Expiration Date" value={formatLinkDate(link.expiresAt)} />
				<DetailRow label="Description" value={link.description ?? "—"} />
			</div>

			{link.status === "active" && (
				<Button
					type="button"
					variant="outline"
					className="border-danger-300 text-danger-700 hover:bg-danger-50"
					loading={cancelLink.isPending}
					onClick={handleCancel}
				>
					Cancel Link
				</Button>
			)}
		</div>
	);
}

export { PaymentLinkDetailCard };
