"use client";

import { Copy } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import { UserAvatar } from "@/features/dashboard/components/UserAvatar";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { stellarExplorerUrl } from "@/lib/stellar";
import type { PaymentMethodKind, RefundStatus } from "@/lib/api/types";
import type { PaymentRefundState } from "@/features/refunds/hooks";

export const METHOD_LABEL: Record<PaymentMethodKind, string> = {
	payment_request: "Request Link",
	payment_link: "Payment Link",
	qr: "QR Code",
};

type BadgeVariant = "pending" | "processing" | "completed" | "failed" | "cancelled";

const REFUND_STATE_BADGE: Record<PaymentRefundState, { variant: BadgeVariant; dot: string; label: string }> = {
	paid: { variant: "completed", dot: "bg-success-600", label: "Paid" },
	refund_pending: { variant: "processing", dot: "bg-info-600", label: "Refund pending" },
	partially_refunded: { variant: "pending", dot: "bg-warning-600", label: "Partially refunded" },
	refunded: { variant: "cancelled", dot: "bg-neutral-400", label: "Refunded" },
};

export const REFUND_STATE_OPTIONS = (Object.keys(REFUND_STATE_BADGE) as PaymentRefundState[]).map(
	(value) => ({ value, label: REFUND_STATE_BADGE[value].label }),
);

const REFUND_STATUS_BADGE: Record<RefundStatus, { variant: BadgeVariant; dot: string; label: string }> = {
	requested: { variant: "pending", dot: "bg-warning-600", label: "Requested" },
	authorized: { variant: "pending", dot: "bg-warning-600", label: "Authorized" },
	processing: { variant: "processing", dot: "bg-info-600", label: "Processing" },
	completed: { variant: "completed", dot: "bg-success-600", label: "Completed" },
	failed: { variant: "failed", dot: "bg-danger-600", label: "Failed" },
};

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = Object.fromEntries(
	Object.entries(REFUND_STATUS_BADGE).map(([k, v]) => [k, v.label]),
) as Record<RefundStatus, string>;

function Pill({ variant, dot, label }: { variant: BadgeVariant; dot: string; label: string }) {
	return (
		<Badge variant={variant}>
			<span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
			{label}
		</Badge>
	);
}

export function RefundStatePill({ state }: { state: PaymentRefundState }) {
	return <Pill {...REFUND_STATE_BADGE[state]} />;
}

export function RefundStatusPill({ status }: { status: RefundStatus }) {
	return <Pill {...REFUND_STATUS_BADGE[status]} />;
}

/** "G9DUEWV****WUGEGO8QDHI" — the mock's masked wallet format. */
export function maskWallet(address: string) {
	return address.length > 20 ? `${address.slice(0, 7)}****${address.slice(-11)}` : address;
}

export function formatShortDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string) {
	return new Date(iso).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export function InfoRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: React.ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className="flex items-start justify-between gap-4 py-2.5 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className={cn("min-w-0 text-right font-semibold break-all text-foreground", valueClassName)}>
				{value}
			</span>
		</div>
	);
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-2">
			<h2 className="text-b2 font-medium text-foreground sm:text-b1">{title}</h2>
			<div className="flex flex-col">{children}</div>
		</section>
	);
}

export function CopyRow({ label, value }: { label: string; value: string }) {
	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied`);
		} catch {
			toast.error("Couldn't copy");
		}
	}

	return (
		<div className="flex items-center justify-between gap-4 py-2.5 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
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

export function ExplorerRow({ hash }: { hash: string }) {
	return (
		<InfoRow
			label="Stellar Explorer Link"
			value={
				<a
					href={stellarExplorerUrl(hash)}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium text-info-600 hover:underline"
				>
					explorer link
				</a>
			}
		/>
	);
}

export function AmountBox({ amount, prefix = "" }: { amount: number; prefix?: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
			<span className="text-s1 text-foreground sm:text-h5">
				{prefix}
				{formatUsdc(amount)} USDC
			</span>
			<span className="text-c1 text-muted-foreground sm:text-b3">~ GHS {formatUsdc(usdcToGhs(amount))}</span>
		</div>
	);
}

export function FromCustomer({ name, phone }: { name: string; phone?: string | null }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-c1 text-muted-foreground sm:text-b3">From</span>
			<div className="flex items-center gap-3">
				<UserAvatar name={name} className="bg-primary-600 text-primary-foreground" />
				<div className="flex flex-col">
					<span className="text-b3 font-medium text-foreground sm:text-b1">{name}</span>
					{phone && <span className="text-c1 text-muted-foreground sm:text-b3">{phone}</span>}
				</div>
			</div>
		</div>
	);
}
