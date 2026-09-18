"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Eye } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";

interface Column<T> {
	key: string;
	label: string;
	render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	/** When present, every row gets a trailing "view" action linking here —
	 * every admin list is a jumping-off point to a detail page, unlike
	 * apps/web's tables this is generic across (there's no per-entity
	 * behavior beyond which columns to show and where "view" goes). */
	getRowHref?: (row: T) => string;
	emptyIcon: LucideIcon;
	emptyTitle: string;
	emptyDescription: string;
}

/**
 * One generic table for every admin list (Users, Businesses, Transactions,
 * Audit Log) — unlike apps/web's own per-entity tables (which stayed
 * bespoke because each needed to know its own detail route), every admin
 * list here is the same shape: a set of columns, rows, and an optional
 * link-per-row to a detail page. Same dual desktop-table/mobile-card
 * treatment as apps/web's tables.
 */
function DataTable<T>({
	columns,
	rows,
	rowKey,
	getRowHref,
	emptyIcon,
	emptyTitle,
	emptyDescription,
}: DataTableProps<T>) {
	if (rows.length === 0) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
			</div>
		);
	}

	return (
		<>
			<div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-muted">
							{columns.map((column) => (
								<th key={column.key} className="p-4 text-label text-muted-foreground">
									{column.label}
								</th>
							))}
							{getRowHref && (
								<th className="p-4 text-label text-muted-foreground">Action</th>
							)}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={rowKey(row)} className="border-t border-border hover:bg-muted/50">
								{columns.map((column) => (
									<td key={column.key} className="p-4 text-b3 text-foreground">
										{column.render(row)}
									</td>
								))}
								{getRowHref && (
									<td className="p-4">
										<Link
											href={getRowHref(row)}
											aria-label="View details"
											className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										>
											<Eye className="size-4" aria-hidden="true" />
										</Link>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{rows.map((row) => (
					<div
						key={rowKey(row)}
						className="flex flex-col gap-3 rounded-xl border border-border p-4"
					>
						{columns.map((column) => (
							<div key={column.key} className="flex items-center justify-between gap-4">
								<span className="text-c1 text-muted-foreground">{column.label}</span>
								<span className="text-b3 font-medium text-foreground">
									{column.render(row)}
								</span>
							</div>
						))}
						{getRowHref && (
							<div className="flex justify-end">
								<Link
									href={getRowHref(row)}
									aria-label="View details"
									className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<Eye className="size-4" aria-hidden="true" />
								</Link>
							</div>
						)}
					</div>
				))}
			</div>
		</>
	);
}

export { DataTable };
export type { Column };
