"use client";

import Link from "next/link";
import { Building2, SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import { CopyButton } from "@/components/data/CopyButton";
import { useAdminPaymentLink } from "@/features/payment-links/hooks";
import { PaymentLinkActions } from "@/features/payment-links/components/PaymentLinkActions";
import { formatDateTime } from "@/lib/format";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { derivePaymentLinkStatus } from "@/lib/api/types";
import type { AdminPaymentLinkStatus } from "@/lib/api/types";

const STATUS_BADGE: Record<
	AdminPaymentLinkStatus,
	{ variant: "completed" | "failed" | "cancelled"; dot: string; label: string }
> = {
	active: { variant: "completed", dot: "bg-success-600", label: "Active" },
	expired: { variant: "failed", dot: "bg-danger-600", label: "Expired" },
	cancelled: { variant: "cancelled", dot: "bg-neutral-400", label: "Cancelled" },
};

function PaymentLinkDetail({ id }: { id: string }) {
	const { data: link, isLoading, isError, error } = useAdminPaymentLink(id);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Skeleton className="h-80 w-full rounded-2xl" />
				<Skeleton className="h-80 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !link) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="Payment link not found"
					description={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
				/>
			</div>
		);
	}

	const badge = STATUS_BADGE[derivePaymentLinkStatus(link)];

	return (
		<div className="flex flex-col gap-4">
			{/* Headline card — the amount is the single most-scanned number on
			    this page, so it gets its own hero treatment above the two-column
			    field grid rather than being just another row inside it. */}
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1">
					<span className="text-b3 text-muted-foreground">{link.title}</span>
					<span className="text-h3 text-foreground tabular-nums">
						{formatUsdc(link.amount)} {link.currency}
					</span>
				</div>
				<Badge variant={badge.variant} className="self-start sm:self-auto">
					<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
					{badge.label}
				</Badge>
			</div>

			<PaymentLinkActions link={link} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DetailCard title="Payment Link">
					<FieldRow
						label="Business"
						value={
							<Link
								href={`/businesses/${link.businessId}`}
								className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
							>
								<Building2 className="size-3.5 shrink-0" aria-hidden="true" />
								{link.businessName ?? `${link.businessId.slice(0, 8)}…`}
							</Link>
						}
					/>
					<FieldRow
						label="Public code"
						value={
							<span className="flex flex-wrap items-center justify-end gap-2">
								<span className="font-mono">{link.publicCode}</span>
								<CopyButton value={link.publicCode} />
							</span>
						}
					/>
					{link.description && <FieldRow label="Description" value={link.description} />}
					{link.customerReference && (
						<FieldRow label="Customer reference" value={link.customerReference} />
					)}
				</DetailCard>

				<DetailCard title="Timeline">
					<FieldRow label="Created" value={formatDateTime(link.createdAt)} />
					<FieldRow label="Last updated" value={formatDateTime(link.updatedAt)} />
					<FieldRow label="Expires" value={formatDateTime(link.expiresAt)} />
					{link.cancelledAt && <FieldRow label="Cancelled" value={formatDateTime(link.cancelledAt)} />}
				</DetailCard>
			</div>
		</div>
	);
}

export { PaymentLinkDetail };
