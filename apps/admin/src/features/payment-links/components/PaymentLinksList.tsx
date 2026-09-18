"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Link2, ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { PaymentLinksFilters } from "@/features/payment-links/components/PaymentLinksFilters";
import { useAdminPaymentLinks } from "@/features/payment-links/hooks";
import { formatDateTime } from "@/lib/format";
import { formatUsdc } from "@/lib/currency";
import { derivePaymentLinkStatus } from "@/lib/api/types";
import type { AdminPaymentLinkData, AdminPaymentLinkStatus, AdminPaymentLinksQuery } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

// Same dot+pill convention as apps/web's own `PaymentLinksTable` — ported
// rather than shared (no cross-app import between admin and web), but kept
// visually identical so a link looks the same status regardless of which
// app someone's viewing it from. Status itself is derived, not a field the
// real response carries — see `derivePaymentLinkStatus`'s own note.
const STATUS_BADGE: Record<
	AdminPaymentLinkStatus,
	{ variant: "completed" | "failed" | "cancelled"; dot: string; label: string }
> = {
	active: { variant: "completed", dot: "bg-success-600", label: "Active" },
	expired: { variant: "failed", dot: "bg-danger-600", label: "Expired" },
	cancelled: { variant: "cancelled", dot: "bg-neutral-400", label: "Cancelled" },
};

function StatusPill({ status }: { status: AdminPaymentLinkStatus }) {
	const badge = STATUS_BADGE[status];
	return (
		<Badge variant={badge.variant}>
			<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
			{badge.label}
		</Badge>
	);
}

/** The list response only ever carries a raw `businessId`, never a name
 * (only the `{id}` detail endpoint adds `businessName` — see
 * `AdminPaymentLinkData`'s own note) — resolving a name here for every row
 * would mean one extra request per row. Links to that business's own
 * detail page instead, same "truncated id, not a fetched name" treatment
 * `WalletsList` already gives wallet addresses. */
function BusinessLink({ businessId }: { businessId: string }) {
	return (
		<Link
			href={`/businesses/${businessId}`}
			className="inline-flex items-center gap-1.5 font-mono text-c1 text-primary-600 hover:underline"
		>
			<Building2 className="size-3.5 shrink-0" aria-hidden="true" />
			{businessId.slice(0, 8)}…
		</Link>
	);
}

const COLUMNS: Column<AdminPaymentLinkData>[] = [
	{
		key: "title",
		label: "Title",
		render: (link) => (
			<span className="block max-w-56 truncate" title={link.title}>
				{link.title}
			</span>
		),
	},
	{ key: "business", label: "Business", render: (link) => <BusinessLink businessId={link.businessId} /> },
	{
		key: "amount",
		label: "Amount",
		render: (link) => (
			<span className="font-semibold text-foreground tabular-nums">
				{formatUsdc(link.amount)} {link.currency}
			</span>
		),
	},
	{
		key: "status",
		label: "Status",
		render: (link) => <StatusPill status={derivePaymentLinkStatus(link)} />,
	},
	{ key: "expiresAt", label: "Expires", render: (link) => formatDateTime(link.expiresAt) },
	{ key: "createdAt", label: "Created", render: (link) => formatDateTime(link.createdAt) },
];

function PaymentLinksList() {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<AdminPaymentLinksQuery["status"] | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const query: AdminPaymentLinksQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
	};
	const { data, isLoading, isError } = useAdminPaymentLinks(query, page, pageSize);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<PaymentLinksFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				status={status}
				onStatusChange={handleFilterChange(setStatus)}
			/>

			{isLoading || !data ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<DataTable
						columns={COLUMNS}
						rows={[]}
						rowKey={(l) => l.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load payment links"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={COLUMNS}
						rows={data.links}
						rowKey={(l) => l.id}
						getRowHref={(l) => `/payment-links/${l.id}`}
						emptyIcon={Link2}
						emptyTitle="No payment links found"
						emptyDescription="Nothing matches your current filters."
					/>
					{data.meta.totalCount > 0 && (
						<Pagination
							page={data.meta.currentPage}
							totalPages={data.meta.pageCount}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={(size) => {
								setPageSize(size);
								setPage(1);
							}}
							pageSizeOptions={PAGE_SIZE_OPTIONS}
							itemsShown={data.links.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { PaymentLinksList };
