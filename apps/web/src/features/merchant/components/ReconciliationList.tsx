"use client";

import { useState } from "react";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import { useExportReconciliationCsv, useReconciliation } from "@/features/merchant/hooks";
import { ReconciliationSummaryCards } from "@/features/merchant/components/ReconciliationSummaryCards";
import { ReconciliationFilters } from "@/features/merchant/components/ReconciliationFilters";
import { ReconciliationTable } from "@/features/merchant/components/ReconciliationTable";
import { FlaggedPaymentsList } from "@/features/merchant/components/FlaggedPaymentsList";
import { cn } from "@repo/ui/lib/utils";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type {
	ReconciliationQuery,
	ReconciliationStatus,
	ReconciliationTransactionType,
} from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Reconciliation list — summary cards + filters + table, all server-side
 * (`GET /merchant/reconciliation` with `q`/`status`/`type`/`from`/`to`). */
function ReconciliationList() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState<ReconciliationStatus | "all">("all");
	const [type, setType] = useState<ReconciliationTransactionType | "all">("all");
	const [view, setView] = useState<"records" | "flags">("records");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: ReconciliationQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
		type: type === "all" ? undefined : type,
		from: from || undefined,
		to: to || undefined,
	};
	const { data, isLoading } = useReconciliation(query, page, pageSize);
	const exportCsv = useExportReconciliationCsv();

	function reset<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	function handleExport() {
		exportCsv.mutate(query, {
			onSuccess: () => toast.success("Reconciliation records exported"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't export reconciliation records")),
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<ReconciliationSummaryCards />

			<div role="tablist" aria-label="Reconciliation views" className="flex gap-1 self-start rounded-xl bg-muted p-1">
				{(
					[
						["records", "Records"],
						["flags", "Flagged payments"],
					] as const
				).map(([value, label]) => (
					<button
						key={value}
						type="button"
						role="tab"
						aria-selected={view === value}
						onClick={() => setView(value)}
						className={cn(
							"rounded-lg px-4 py-2 text-b3 font-medium transition-colors",
							view === value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</button>
				))}
			</div>

			{view === "flags" ? (
				<FlaggedPaymentsList />
			) : (
			<div className="flex flex-col gap-4">
				<ReconciliationFilters
					search={search}
					onSearchChange={reset(setSearch)}
					from={from}
					onFromChange={reset(setFrom)}
					to={to}
					onToChange={reset(setTo)}
					status={status}
					onStatusChange={reset(setStatus)}
					type={type}
					onTypeChange={reset(setType)}
					onExport={handleExport}
					exporting={exportCsv.isPending}
				/>

				{isLoading || !data ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-11 w-full" />
						<Skeleton className="h-72 w-full rounded-xl" />
					</div>
				) : (
					<>
						<ReconciliationTable records={data.records} />
						{data.meta.totalCount > 0 && (
							<Pagination
								page={data.meta.currentPage}
								totalPages={data.meta.pageCount}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={(value) => {
									setPageSize(value);
									setPage(1);
								}}
								pageSizeOptions={PAGE_SIZE_OPTIONS}
								itemsShown={data.records.length}
								total={data.meta.totalCount}
							/>
						)}
					</>
				)}
			</div>
			)}
		</div>
	);
}

export { ReconciliationList };
