"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { DetailCard } from "@/components/data/DetailCard";
import { useWalletFundingIntents } from "@/features/wallets/hooks";
import { formatDateTime } from "@/lib/format";
import { formatUsdc } from "@/lib/currency";
import type { AdminFundingIntentData } from "@/lib/api/types";

const STATUS_VARIANT: Record<AdminFundingIntentData["status"], "pending" | "completed" | "cancelled" | "failed"> = {
	pending: "pending",
	completed: "completed",
	expired: "cancelled",
	failed: "failed",
};

/** Funding intents — "announce you're about to send USDC from an external
 * wallet, then get matched once it arrives" (the customer-facing
 * `fund/intent` flow apps/web itself doesn't wire up yet). Real response
 * shape unverified here (see `AdminFundingIntentData`'s own note). */
function WalletFundingIntentsCard({ walletId }: { walletId: string }) {
	const [page] = useState(1);
	const { data: intents, isLoading } = useWalletFundingIntents(walletId, {}, page, 20);

	return (
		<DetailCard title="Funding Intents">
			{isLoading ? (
				<Skeleton className="h-24 w-full" />
			) : !intents || intents.length === 0 ? (
				<EmptyState icon={Clock} title="No funding intents yet" />
			) : (
				<div className="flex flex-col gap-3">
					{intents.map((intent) => (
						<div key={intent.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
							<div className="flex items-center justify-between gap-4">
								<span className="text-b3 font-medium text-foreground">
									{formatUsdc(intent.expectedAmount)} {intent.asset}
								</span>
								<Badge variant={STATUS_VARIANT[intent.status]}>{intent.status}</Badge>
							</div>
							<span className="text-c1 text-muted-foreground">
								Memo {intent.memo} · created {formatDateTime(intent.createdAt)}
							</span>
							{intent.stellarTxHash && (
								<span className="truncate text-c1 text-muted-foreground">
									Tx {intent.stellarTxHash}
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</DetailCard>
	);
}

export { WalletFundingIntentsCard };
