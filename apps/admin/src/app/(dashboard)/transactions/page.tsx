import type { Metadata } from "next";
import { TransactionsList } from "@/features/transactions/components/TransactionsList";

export const metadata: Metadata = { title: "Transactions — Peakline Admin" };

export default function TransactionsPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Transactions</h1>
				<p className="text-b3 text-muted-foreground">Every ledger transaction, platform-wide.</p>
			</div>
			<TransactionsList />
		</div>
	);
}
