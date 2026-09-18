"use client";

import { useState } from "react";
import { Wallet as WalletIcon, ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { WalletsFilters } from "@/features/wallets/components/WalletsFilters";
import { useAdminWallets } from "@/features/wallets/hooks";
import { formatDateTime } from "@/lib/format";
import type { AdminWalletData, AdminWalletsQuery } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

const COLUMNS: Column<AdminWalletData>[] = [
	{
		key: "publicKey",
		label: "Address",
		render: (w) => `${w.publicKey.slice(0, 6)}...${w.publicKey.slice(-6)}`,
	},
	{ key: "walletType", label: "Type", render: (w) => w.walletType },
	{ key: "network", label: "Network", render: (w) => w.network },
	{
		key: "status",
		label: "Status",
		render: (w) =>
			w.deactivatedAt ? (
				<Badge variant="failed">Deactivated</Badge>
			) : (
				<Badge variant="completed">Active</Badge>
			),
	},
	{ key: "createdAt", label: "Created", render: (w) => formatDateTime(w.createdAt) },
];

function WalletsList() {
	const [search, setSearch] = useState("");
	const [walletType, setWalletType] = useState<AdminWalletsQuery["walletType"] | "all">("all");
	const [isDeactivated, setIsDeactivated] = useState<AdminWalletsQuery["isDeactivated"] | "all">(
		"all",
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const query: AdminWalletsQuery = {
		userId: search.trim() || undefined,
		walletType: walletType === "all" ? undefined : walletType,
		isDeactivated: isDeactivated === "all" ? undefined : isDeactivated,
	};
	const { data, isLoading, isError } = useAdminWallets(query, page, pageSize);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<WalletsFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				walletType={walletType}
				onWalletTypeChange={handleFilterChange(setWalletType)}
				isDeactivated={isDeactivated}
				onIsDeactivatedChange={handleFilterChange(setIsDeactivated)}
			/>

			{isLoading || !data ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<DataTable
						columns={COLUMNS}
						rows={[]}
						rowKey={(w) => w.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load wallets"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={COLUMNS}
						rows={data.wallets}
						rowKey={(w) => w.id}
						getRowHref={(w) => `/wallets/${w.id}`}
						emptyIcon={WalletIcon}
						emptyTitle="No wallets found"
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
							itemsShown={data.wallets.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { WalletsList };
