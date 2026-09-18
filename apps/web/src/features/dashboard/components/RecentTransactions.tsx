"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { useRecentTransactions } from "@/features/dashboard/hooks";
import { TransactionRow } from "@/features/transactions/components/TransactionRow";

function RecentTransactionsSkeleton() {
	return (
		<div className="flex flex-col">
			{Array.from({ length: 4 }, (_, i) => (
				<div
					key={i}
					className="flex items-center gap-4 border-b border-border py-4 last:border-0"
				>
					<Skeleton className="size-11 shrink-0 rounded-full" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-4 w-40 max-w-full" />
						<Skeleton className="h-3 w-24" />
					</div>
					<div className="flex flex-col items-end gap-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-3 w-16" />
					</div>
				</div>
			))}
		</div>
	);
}

function RecentTransactions() {
	const { data } = useRecentTransactions();

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="text-s1 text-foreground sm:text-h5">Recent Transactions</h2>
				<Link
					href="/transactions"
					className="text-c2 font-medium text-primary hover:underline sm:text-b3"
				>
					View all
				</Link>
			</div>

			{!data ? (
				<RecentTransactionsSkeleton />
			) : data.length === 0 ? (
				<EmptyState
					icon={ArrowLeftRight}
					title="No transactions yet"
					description="Send, receive, or pay someone to see your activity here."
				/>
			) : (
				<div className="flex flex-col">
					{data.map((transaction) => (
						<TransactionRow key={transaction.id} transaction={transaction} />
					))}
				</div>
			)}
		</div>
	);
}

export { RecentTransactions };
