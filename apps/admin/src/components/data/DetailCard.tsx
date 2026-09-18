/** A titled card of label/value rows — the read-only "everything about this
 * record" layout every Phase 1 detail screen uses (Users, Businesses,
 * Transactions, Audit Log). Phase 2's own action buttons (lock, suspend,
 * reverse, ...) attach to this same card shape rather than a different one
 * per entity. */
function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
			<h2 className="text-b2 font-semibold text-foreground">{title}</h2>
			<dl className="flex flex-col gap-3">{children}</dl>
		</div>
	);
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
			<dt className="text-c1 text-muted-foreground">{label}</dt>
			<dd className="text-b3 font-medium text-foreground sm:text-right">{value ?? "—"}</dd>
		</div>
	);
}

export { DetailCard, FieldRow };
