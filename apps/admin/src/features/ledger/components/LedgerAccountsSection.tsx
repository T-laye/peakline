"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { Pagination } from "@/components/data/Pagination";
import { DynamicTable } from "@/components/data/DynamicTable";
import { useLedgerAccounts, type LedgerAccountsQuery } from "@/features/ledger/hooks";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function LedgerAccountsSection() {
	const [userId, setUserId] = useState("");
	const [accountType, setAccountType] = useState<LedgerAccountsQuery["accountType"] | "all">(
		"all",
	);
	const [currency, setCurrency] = useState<LedgerAccountsQuery["currency"] | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const query: LedgerAccountsQuery = {
		userId: userId.trim() || undefined,
		accountType: accountType === "all" ? undefined : accountType,
		currency: currency === "all" ? undefined : currency,
	};
	const { data, isLoading } = useLedgerAccounts(query, page, pageSize);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
				<Input
					value={userId}
					onChange={(e) => handleFilterChange(setUserId)(e.target.value)}
					placeholder="Filter by user ID"
					aria-label="Filter by user ID"
					className="flex-1 lg:min-w-56"
				/>
				<Select
					value={accountType}
					onChange={(e) =>
						handleFilterChange(setAccountType)(
							e.target.value as LedgerAccountsQuery["accountType"] | "all",
						)
					}
					aria-label="Filter by account type"
					className="lg:w-52"
				>
					<option value="all">All account types</option>
					<option value="user">User</option>
					<option value="system">System</option>
				</Select>
				<Select
					value={currency}
					onChange={(e) =>
						handleFilterChange(setCurrency)(e.target.value as LedgerAccountsQuery["currency"] | "all")
					}
					aria-label="Filter by currency"
					className="lg:w-40"
				>
					<option value="all">All currencies</option>
					<option value="USDC">USDC</option>
					<option value="GHS">GHS</option>
				</Select>
			</div>

			{isLoading || !data ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : (
				<>
					<DynamicTable
						rows={data.accounts}
						emptyIcon={Landmark}
						emptyTitle="No ledger accounts found"
						emptyDescription="Nothing matches your current filters."
						getRowHref={(row) => (typeof row.id === "string" ? `/ledger/${row.id}` : null)}
					/>
					{data.meta && data.meta.totalCount > 0 && (
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
							itemsShown={data.accounts.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { LedgerAccountsSection };
