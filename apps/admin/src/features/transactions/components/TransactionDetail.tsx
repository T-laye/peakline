"use client";

import { SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { StatusBadge } from "@repo/ui/badge";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import { useAdminTransaction } from "@/features/transactions/hooks";
import { TransactionActions } from "@/features/transactions/components/TransactionActions";
import { TransactionLedgerEntriesCard } from "@/features/transactions/components/TransactionLedgerEntriesCard";
import { formatDateTime } from "@/lib/format";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

const TYPE_LABEL: Record<string, string> = {
	deposit: "Deposit",
	withdrawal: "Withdrawal",
	internal_transfer: "Internal Transfer",
	conversion: "Conversion",
	withdrawal_ghs: "Withdrawal (GHS)",
};

/** `GET /admin/transactions/{id}`'s real response schema is undocumented
 * (a Swagger annotation bug — see `AdminTransactionData`'s own note), so
 * this renders the fields the list/query params confirm exist, each
 * defensively optional, plus a raw-JSON fallback for everything else the
 * real response carries that this guessed shape didn't anticipate. Once a
 * real response is seen live, tighten this back to a plain typed render. */
function TransactionDetail({ id }: { id: string }) {
	const { data: tx, isLoading, isError, error } = useAdminTransaction(id);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Skeleton className="h-80 w-full rounded-2xl" />
				<Skeleton className="h-80 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !tx) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="Transaction not found"
					description={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<TransactionActions transaction={tx} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DetailCard title="Transaction">
					<FieldRow label="Type" value={TYPE_LABEL[tx.type] ?? tx.type ?? "—"} />
					<FieldRow
						label="Amount"
						value={tx.amount ? `${formatUsdc(tx.amount)} ${tx.currency ?? ""}` : "—"}
					/>
					{tx.fee && <FieldRow label="Fee" value={`${formatUsdc(tx.fee)} ${tx.currency ?? ""}`} />}
					<FieldRow label="Status" value={tx.status ? <StatusBadge status={tx.status} /> : "—"} />
					{tx.direction && <FieldRow label="Direction" value={tx.direction} />}
					<FieldRow label="User ID" value={tx.userId ?? "—"} />
					{tx.businessId && <FieldRow label="Business ID" value={tx.businessId} />}
				</DetailCard>

				<DetailCard title="Ledger Details">
					{tx.stellarTxHash && <FieldRow label="Stellar tx hash" value={tx.stellarTxHash} />}
					{tx.externalAddress && (
						<FieldRow label="External address" value={tx.externalAddress} />
					)}
					{tx.fxRate && <FieldRow label="FX rate" value={tx.fxRate} />}
					{tx.toCurrency && <FieldRow label="Converted to" value={tx.toCurrency} />}
					{tx.toAmount && <FieldRow label="Converted amount" value={tx.toAmount} />}
					<FieldRow label="Created" value={formatDateTime(tx.createdAt)} />
					<FieldRow label="Completed" value={formatDateTime(tx.completedAt)} />
				</DetailCard>
			</div>

			{tx.metadata && Object.keys(tx.metadata).length > 0 && (
				<DetailCard title="Metadata">
					<pre className="overflow-x-auto rounded-lg bg-muted p-4 text-c1 text-foreground">
						{JSON.stringify(tx.metadata, null, 2)}
					</pre>
				</DetailCard>
			)}

			<TransactionLedgerEntriesCard transactionId={tx.id} />
		</div>
	);
}

export { TransactionDetail };
