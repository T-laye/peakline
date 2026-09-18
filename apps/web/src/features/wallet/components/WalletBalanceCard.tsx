"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { FundWalletDialog } from "@/features/wallet/components/FundWalletDialog";
import { formatUsdc } from "@/lib/currency";
import { useAuthStore } from "@/lib/stores/authStore";

function WalletBalanceCardSkeleton() {
	return (
		<div className="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-6 sm:p-8">
			<Skeleton className="h-4 w-32 bg-neutral-200" />
			<Skeleton className="h-9 w-48 bg-neutral-200" />
			<div className="flex gap-3">
				<Skeleton className="h-11 w-28 bg-neutral-200" />
				<Skeleton className="h-11 w-28 bg-neutral-200" />
			</div>
		</div>
	);
}

/**
 * The Wallet page's balance display — `useWalletBalance` (shared with the
 * Dashboard's own `BalanceCard` and the Send/Fund/Pay success steps), which
 * combines the wallet's own `balances` (`GET /wallets/stellar`) with the
 * ledger's rollup (`GET /transactions/balances`) and takes the higher of
 * the two per currency — see that hook's own doc comment for why neither
 * one alone is reliably complete. Both USDC and GHS are real balances
 * either way, not an FX-converted estimate.
 *
 * The mock's own second "Pending Balance" section was fake data with no
 * real endpoint behind it and the user asked for it gone rather than left
 * showing a number that could never be true. Shared by both account
 * types — individual gets a second "Send" action; merchant gets "Add
 * Money" alone (its own former "Withdraw" button removed for now — no real
 * withdrawal flow exists yet).
 */
function WalletBalanceCard() {
	const { data: available, isLoading } = useWalletBalance();
	const [availableVisible, setAvailableVisible] = useState(true);
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");

	if (isLoading || !available) return <WalletBalanceCardSkeleton />;

	const usdc = available.amount;
	const ghs = available.localAmount;

	return (
		<div className="flex w-full flex-col gap-6 rounded-2xl bg-linear-to-br from-primary-500 to-primary-800 p-6 text-primary-foreground sm:p-8">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-2">
					<span className="text-c1 text-primary-100 sm:text-b3">
						Available Balance
					</span>
					<span className="text-h5 sm:text-h4">
						{availableVisible ? `${formatUsdc(usdc)} USDC` : "•••••• USDC"}
					</span>
					<span className="text-c1 text-primary-100 sm:text-b3">
						{availableVisible ? `~ GHS ${formatUsdc(ghs)}` : "~ GHS ••••••"}
					</span>
				</div>
				<button
					type="button"
					onClick={() => setAvailableVisible((v) => !v)}
					aria-label={
						availableVisible ? "Hide available balance" : "Show available balance"
					}
					className="shrink-0 text-primary-100 transition-colors hover:text-primary-foreground"
				>
					{availableVisible ? (
						<Eye className="size-5" aria-hidden="true" />
					) : (
						<EyeOff className="size-5" aria-hidden="true" />
					)}
				</button>
			</div>

			<div className="flex gap-3">
				<Button
					asChild
					variant="ghost"
					className="bg-background text-foreground hover:bg-neutral-100 lg:hidden"
				>
					<Link href="/wallet/fund">Add Money</Link>
				</Button>
				<FundWalletDialog>
					<Button
						type="button"
						variant="ghost"
						className="hidden bg-background text-foreground hover:bg-neutral-100 lg:inline-flex"
					>
						Add Money
					</Button>
				</FundWalletDialog>
				{!isMerchant && (
					<Button
						asChild
						variant="ghost"
						className="bg-background text-foreground hover:bg-neutral-100"
					>
						<Link href="/send">Send</Link>
					</Button>
				)}
			</div>
		</div>
	);
}

export { WalletBalanceCard };
