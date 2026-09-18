"use client";

import { BookOpen } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { DynamicTable } from "@/components/data/DynamicTable";
import { useTransactionLedgerEntries } from "@/features/transactions/hooks";

/** "Raw ledger entries" — genuinely unconfirmed shape (see that hook's own
 * note), rendered with `DynamicTable` rather than guessed columns. */
function TransactionLedgerEntriesCard({ transactionId }: { transactionId: string }) {
	const { data: entries, isLoading } = useTransactionLedgerEntries(transactionId);

	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
			<h2 className="text-b2 font-semibold text-foreground">Ledger Entries</h2>
			{isLoading ? (
				<Skeleton className="h-24 w-full" />
			) : (
				<DynamicTable
					rows={entries ?? []}
					emptyIcon={BookOpen}
					emptyTitle="No ledger entries"
					emptyDescription="Nothing recorded for this transaction yet."
				/>
			)}
		</div>
	);
}

export { TransactionLedgerEntriesCard };
