"use client";

import { SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import { useAdminWallet } from "@/features/wallets/hooks";
import { WalletActions } from "@/features/wallets/components/WalletActions";
import { WalletFundingIntentsCard } from "@/features/wallets/components/WalletFundingIntentsCard";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

function WalletDetail({ id }: { id: string }) {
	const { data: wallet, isLoading, isError, error } = useAdminWallet(id);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Skeleton className="h-80 w-full rounded-2xl" />
				<Skeleton className="h-80 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !wallet) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="Wallet not found"
					description={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<WalletActions wallet={wallet} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DetailCard title="Wallet">
					<FieldRow label="Address" value={<span className="break-all">{wallet.publicKey}</span>} />
					<FieldRow label="Type" value={wallet.walletType} />
					<FieldRow label="Network" value={wallet.network} />
					<FieldRow
						label="Status"
						value={
							wallet.deactivatedAt ? (
								<Badge variant="failed">Deactivated</Badge>
							) : (
								<Badge variant="completed">Active</Badge>
							)
						}
					/>
					<FieldRow label="User ID" value={wallet.userId} />
					{wallet.businessId && <FieldRow label="Business ID" value={wallet.businessId} />}
					{wallet.label && <FieldRow label="Label" value={wallet.label} />}
				</DetailCard>

				<DetailCard title="Timeline">
					<FieldRow label="Created" value={formatDateTime(wallet.createdAt)} />
					<FieldRow label="Last updated" value={formatDateTime(wallet.updatedAt)} />
					{wallet.deactivatedAt && (
						<FieldRow label="Deactivated" value={formatDateTime(wallet.deactivatedAt)} />
					)}
					{wallet.federationAddress && (
						<FieldRow label="Federation address" value={wallet.federationAddress} />
					)}
				</DetailCard>
			</div>

			<WalletFundingIntentsCard walletId={wallet.id} />
		</div>
	);
}

export { WalletDetail };
