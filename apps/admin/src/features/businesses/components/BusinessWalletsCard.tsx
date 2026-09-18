"use client";

import { Wallet } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { DetailCard } from "@/components/data/DetailCard";
import { useBusinessWallets } from "@/features/businesses/hooks";
import { formatDateTime } from "@/lib/format";

function BusinessWalletsCard({ businessId }: { businessId: string }) {
	const { data: wallets, isLoading } = useBusinessWallets(businessId);

	return (
		<DetailCard title="Wallets">
			{isLoading ? (
				<Skeleton className="h-24 w-full" />
			) : !wallets || wallets.length === 0 ? (
				<EmptyState icon={Wallet} title="No wallets yet" />
			) : (
				<div className="flex flex-col gap-3">
					{wallets.map((wallet) => (
						<div
							key={wallet.id}
							className="flex flex-col gap-1 rounded-lg border border-border p-3"
						>
							<div className="flex items-center justify-between gap-4">
								<span className="truncate text-b3 font-medium text-foreground">
									{wallet.publicKey}
								</span>
								{wallet.deactivatedAt ? (
									<Badge variant="cancelled">Deactivated</Badge>
								) : (
									<Badge variant="completed">Active</Badge>
								)}
							</div>
							<span className="text-c1 text-muted-foreground">
								{wallet.network} · created {formatDateTime(wallet.createdAt)}
							</span>
						</div>
					))}
				</div>
			)}
		</DetailCard>
	);
}

export { BusinessWalletsCard };
