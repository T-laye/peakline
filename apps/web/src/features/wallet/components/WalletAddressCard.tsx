"use client";

import { Copy } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { useMyWallet } from "@/features/wallet/hooks";
import { maskWalletAddress } from "@/lib/wallet";

/** Plain outlined card (unlike the wallet-created page's gold-tinted
 * version of the same address) — a persistent, mundane info display rather
 * than a one-time reveal. Real wallet now (`useMyWallet` — always the
 * account's own `GET /wallets/stellar`, individual or merchant alike; see
 * that hook's own note) — previously a fixed fake address shown regardless
 * of what account was actually signed in. */
function WalletAddressCard() {
	const { data: wallet, isLoading } = useMyWallet();

	async function handleCopy() {
		if (!wallet) return;
		try {
			await navigator.clipboard.writeText(wallet.publicKey);
			toast.success("Wallet address copied");
		} catch {
			toast.error("Couldn't copy the address");
		}
	}

	if (isLoading) {
		return (
			<div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-5 w-48" />
			</div>
		);
	}

	if (!wallet) {
		return (
			<div className="flex w-full flex-col gap-1.5 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<span className="text-c1 text-muted-foreground sm:text-b3">
					Your wallet address
				</span>
				<span className="text-b3 text-muted-foreground sm:text-b2">
					No wallet yet
				</span>
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-1.5 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<span className="text-c1 text-muted-foreground sm:text-b3">
				Your wallet address
			</span>
			<div className="flex items-center justify-between gap-4">
				<span className="truncate text-b3 text-foreground sm:text-b2">
					{maskWalletAddress(wallet.publicKey)}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					aria-label="Copy wallet address"
					className="shrink-0 text-muted-foreground hover:text-foreground"
				>
					<Copy className="size-5" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
}

export { WalletAddressCard };
