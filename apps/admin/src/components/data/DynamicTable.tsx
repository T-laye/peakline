"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Eye } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";
import type { UnknownRecord } from "@/lib/api/types";

/** An ISO-8601-looking string gets the same absolute-timestamp treatment
 * `formatDateTime` gives confirmed date fields elsewhere — everything else
 * (numbers, plain strings) renders as-is, and anything else (objects,
 * arrays, null) falls back to a compact JSON string rather than
 * `[object Object]`. */
function formatCell(value: unknown): string {
	if (value === null || value === undefined) return "—";
	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) {
			return date.toLocaleString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			});
		}
	}
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

interface DynamicTableProps {
	rows: UnknownRecord[];
	emptyIcon: LucideIcon;
	emptyTitle: string;
	emptyDescription: string;
	/** Row identity for React's own `key` — falls back to JSON-stringifying
	 * the row when there's no obvious `id` field, since the real field
	 * names here aren't confirmed (see `UnknownRecord`'s own note). */
	rowKey?: (row: UnknownRecord, index: number) => string;
	/** When present, every row gets a trailing "view" action linking here —
	 * same convention as `DataTable`'s own prop. */
	getRowHref?: (row: UnknownRecord, index: number) => string | null;
}

/**
 * A table whose columns are discovered from the data itself — the union of
 * every key across every row it's given, in first-seen order — rather than
 * a fixed column list. The Ledger group's own response shapes are entirely
 * unconfirmed (see `UnknownRecord`), so this renders exactly what the API
 * actually sends back instead of a guessed set of named columns that might
 * not match. Same dual desktop-table/mobile-card shape as `DataTable`.
 */
function DynamicTable({
	rows,
	emptyIcon,
	emptyTitle,
	emptyDescription,
	rowKey,
	getRowHref,
}: DynamicTableProps) {
	if (rows.length === 0) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
			</div>
		);
	}

	const columns: string[] = [];
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			if (!columns.includes(key)) columns.push(key);
		}
	}

	function getRowKey(row: UnknownRecord, index: number) {
		if (rowKey) return rowKey(row, index);
		if (typeof row.id === "string") return row.id;
		return String(index);
	}

	return (
		<>
			<div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-muted">
							{columns.map((column) => (
								<th key={column} className="p-4 text-label text-muted-foreground whitespace-nowrap">
									{column}
								</th>
							))}
							{getRowHref && (
								<th className="p-4 text-label text-muted-foreground">Action</th>
							)}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, index) => {
							const href = getRowHref?.(row, index);
							return (
								<tr key={getRowKey(row, index)} className="border-t border-border hover:bg-muted/50">
									{columns.map((column) => (
										<td key={column} className="p-4 text-b3 text-foreground whitespace-nowrap">
											{formatCell(row[column])}
										</td>
									))}
									{getRowHref && (
										<td className="p-4">
											{href && (
												<Link
													href={href}
													aria-label="View details"
													className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
												>
													<Eye className="size-4" aria-hidden="true" />
												</Link>
											)}
										</td>
									)}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{rows.map((row, index) => {
					const href = getRowHref?.(row, index);
					return (
						<div
							key={getRowKey(row, index)}
							className="flex flex-col gap-3 rounded-xl border border-border p-4"
						>
							{columns.map((column) => (
								<div key={column} className="flex items-center justify-between gap-4">
									<span className="text-c1 text-muted-foreground">{column}</span>
									<span className="max-w-[60%] truncate text-right text-b3 font-medium text-foreground">
										{formatCell(row[column])}
									</span>
								</div>
							))}
							{getRowHref && href && (
								<div className="flex justify-end">
									<Link
										href={href}
										aria-label="View details"
										className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										<Eye className="size-4" aria-hidden="true" />
									</Link>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</>
	);
}

export { DynamicTable };
