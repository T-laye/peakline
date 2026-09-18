"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@repo/ui/select";
import { cn } from "@repo/ui/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

interface PaginationProps {
	page: number;
	totalPages: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	pageSizeOptions?: number[];
	/** How many rows are actually on the current page — usually `<= pageSize`
	 * (the last page is often a partial one). */
	itemsShown: number;
	total: number;
}

/** Ported verbatim from apps/web's own `components/Pagination.tsx` — same
 * "Showing X of Y entries" + page-size `Select` + numbered prev/next
 * controls every admin list needs. */
function Pagination({
	page,
	totalPages,
	pageSize,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
	itemsShown,
	total,
}: PaginationProps) {
	return (
		<div className="flex flex-col items-center justify-between gap-3 text-c1 text-muted-foreground sm:flex-row sm:text-b3">
			<div className="flex items-center gap-2">
				{onPageSizeChange ? (
					<>
						<span className="hidden sm:inline">Showing</span>
						<Select
							value={String(pageSize)}
							onChange={(e) => onPageSizeChange(Number(e.target.value))}
							aria-label="Rows per page"
							className="hidden h-9 w-20 pr-8 sm:flex"
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</Select>
						<span className="sm:hidden">Showing {itemsShown}</span>
					</>
				) : (
					<span>Showing {itemsShown}</span>
				)}
				<span>of {total} entries</span>
			</div>

			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={() => onPageChange(Math.max(1, page - 1))}
					disabled={page === 1}
					aria-label="Previous page"
					className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground disabled:cursor-not-allowed disabled:opacity-40"
				>
					<ChevronLeft className="size-4" aria-hidden="true" />
				</button>
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
					<button
						key={p}
						type="button"
						onClick={() => onPageChange(p)}
						aria-current={p === page ? "page" : undefined}
						className={cn(
							"flex size-8 items-center justify-center rounded-lg text-b3 font-medium",
							p === page
								? "bg-primary-500 text-primary-foreground"
								: "text-foreground hover:bg-muted",
						)}
					>
						{p}
					</button>
				))}
				<button
					type="button"
					onClick={() => onPageChange(Math.min(totalPages, page + 1))}
					disabled={page === totalPages}
					aria-label="Next page"
					className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground disabled:cursor-not-allowed disabled:opacity-40"
				>
					<ChevronRight className="size-4" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
}

export { Pagination };
