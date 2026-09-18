"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { FundWalletDialog } from "@/features/wallet/components/FundWalletDialog";

function formatAmount(amount: number) {
	return amount.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function BalanceCardSkeleton() {
	return (
		<div className="flex w-full flex-col gap-4 rounded-2xl bg-neutral-100 p-6 sm:p-8">
			<Skeleton className="h-4 w-32 bg-neutral-200" />
			<Skeleton className="h-9 w-48 bg-neutral-200" />
			<Skeleton className="h-4 w-24 bg-neutral-200" />
			<div className="flex gap-3">
				<Skeleton className="h-11 w-28 bg-neutral-200" />
				<Skeleton className="h-11 w-28 bg-neutral-200" />
			</div>
		</div>
	);
}

/**
 * The individual dashboard's own balance display — individual-only now.
 * Used to also stand in, mobile-only, for merchant Overview's stat cards;
 * reported live as wrong (mobile showed "wallet" instead of the same proper
 * cards desktop had), so `DashboardOverview` renders `MerchantStatsCards`
 * on both breakpoints now and this dropped its `isMerchant` branch — same
 * former "Withdraw" button removed for now (no real withdrawal flow exists
 * yet) as `WalletBalanceCard`.
 */
function BalanceCard() {
	const { data } = useWalletBalance();
	const [visible, setVisible] = useState(true);

	if (!data) return <BalanceCardSkeleton />;

	return (
		<div className="flex w-full flex-col gap-6 rounded-2xl bg-linear-to-br from-primary-500 to-primary-800 p-6 text-primary-foreground sm:p-8">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-2">
					<span className="text-c1 text-primary-100 sm:text-b3">
						Available Balance
					</span>
					<span className="text-h5 sm:text-h4 lg:text-h3">
						{visible
							? `${formatAmount(data.amount)} ${data.currency}`
							: "•••••• " + data.currency}
					</span>
					<span className="text-c1 text-primary-100 sm:text-b3">
						{visible
							? `~ ${data.localCurrency} ${formatAmount(data.localAmount)}`
							: `~ ${data.localCurrency} ••••••`}
					</span>
				</div>
				<button
					type="button"
					onClick={() => setVisible((v) => !v)}
					aria-label={visible ? "Hide balance" : "Show balance"}
					className="shrink-0 text-primary-100 transition-colors hover:text-primary-foreground"
				>
					{visible ? (
						<Eye className="size-5" aria-hidden="true" />
					) : (
						<EyeOff className="size-5" aria-hidden="true" />
					)}
				</button>
			</div>

			<div className="flex gap-3">
				{/* Mobile gets a real page instead of a modal; desktop keeps the
				    modal. Both render so the switch is pure CSS, not JS. */}
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
				<Button
					asChild
					variant="ghost"
					className="bg-background text-foreground hover:bg-neutral-100"
				>
					<Link href="/send">Send</Link>
				</Button>
			</div>
		</div>
	);
}

export { BalanceCard };
