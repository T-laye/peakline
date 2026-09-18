"use client";

import { SearchX } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import type { UnknownRecord } from "@/lib/api/types";

function formatValue(value: unknown): React.ReactNode {
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
	if (typeof value === "object") {
		return (
			<pre className="max-w-xs overflow-x-auto text-left text-c1 whitespace-pre-wrap">
				{JSON.stringify(value, null, 2)}
			</pre>
		);
	}
	return String(value);
}

interface DynamicRecordProps {
	title: string;
	record: UnknownRecord | null | undefined;
	notFoundTitle: string;
	notFoundDescription: string;
}

/** A single unknown-shaped record as a plain key/value card — every field
 * the API actually returned, in whatever order it came back, rather than a
 * fixed set of named rows (see `DynamicTable`'s own note on why: the
 * Ledger group's real response shapes aren't confirmed at all). */
function DynamicRecord({ title, record, notFoundTitle, notFoundDescription }: DynamicRecordProps) {
	if (!record) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState icon={SearchX} title={notFoundTitle} description={notFoundDescription} />
			</div>
		);
	}

	return (
		<DetailCard title={title}>
			{Object.entries(record).map(([key, value]) => (
				<FieldRow key={key} label={key} value={formatValue(value)} />
			))}
		</DetailCard>
	);
}

export { DynamicRecord };
