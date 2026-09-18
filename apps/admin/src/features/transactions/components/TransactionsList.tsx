"use client";

import { useState } from "react";
import { ArrowLeftRight, ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { StatusBadge } from "@repo/ui/badge";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { TransactionsFilters } from "@/features/transactions/components/TransactionsFilters";
import { useAdminTransactions } from "@/features/transactions/hooks";
import { formatDateTime } from "@/lib/format";
import { formatUsdc } from "@/lib/currency";
import type { AdminTransactionData, AdminTransactionsQuery } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const TYPE_LABEL: Record<AdminTransactionData["type"], string> = {
	deposit: "Deposit",
	withdrawal: "Withdrawal",
	internal_transfer: "Internal Transfer",
	conversion: "Conversion",
	withdrawal_ghs: "Withdrawal (GHS)",
};

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

const COLUMNS: Column<AdminTransactionData>[] = [
	{ key: "type", label: "Type", render: (tx) => TYPE_LABEL[tx.type] ?? tx.type },
	{
		key: "amount",
		label: "Amount",
		render: (tx) => `${formatUsdc(tx.amount)} ${tx.currency}`,
	},
	{ key: "userId", label: "User ID", render: (tx) => tx.userId },
	{ key: "status", label: "Status", render: (tx) => <StatusBadge status={tx.status} /> },
	{
		key: "createdAt",
		label: "Date",
		render: (tx) => formatDateTime(tx.completedAt ?? tx.createdAt),
	},
];

function TransactionsList() {
	const [search, setSearch] = useState("");
	const [type, setType] = useState<AdminTransactionsQuery["type"] | "all">("all");
	const [status, setStatus] = useState<AdminTransactionsQuery["status"] | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const query: AdminTransactionsQuery = {
		q: search.trim() || undefined,
		type: type === "all" ? undefined : type,
		status: status === "all" ? undefined : status,
	};
	const { data, isLoading, isError } = useAdminTransactions(query, page, pageSize);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<TransactionsFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				type={type}
				onTypeChange={handleFilterChange(setType)}
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
						rowKey={(tx) => tx.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load transactions"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={COLUMNS}
						rows={data.transactions}
						rowKey={(tx) => tx.id}
						getRowHref={(tx) => `/transactions/${tx.id}`}
						emptyIcon={ArrowLeftRight}
						emptyTitle="No transactions found"
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
							itemsShown={data.transactions.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { TransactionsList };
