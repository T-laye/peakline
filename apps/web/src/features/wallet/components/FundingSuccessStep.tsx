"use client";

import { Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { FundWalletResultData } from "@/lib/api/types";

interface FundingSuccessStepProps {
	result: FundWalletResultData;
	onGoToDashboard: () => void;
	onViewTransactions: () => void;
}

/** Step 4a. `result` is the real faucet response (`txHash`/`amount`/
 * `asset`). New Balance reads straight from `useWalletBalance`, refetched
 * via the funding mutation's own cache invalidation, rather than computed
 * client-side (current + funded) — a real, already-updated balance exists
 * to ask for now, same reasoning Send/Pay's own real success steps use.
 *
 * `min-h-full` + `justify-center` vertically centers this the same way
 * `FundingProcessingStep` already does — has no effect inside the desktop
 * dialog (its container is content-sized, so a percentage height resolves
 * to nothing there per spec), only on the mobile full-page route, which is
 * exactly what's wanted. */
function FundingSuccessStep({
	result,
	onGoToDashboard,
	onViewTransactions,
}: FundingSuccessStepProps) {
	const { data: balance } = useWalletBalance();
	const amount = Number(result.amount);

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 py-2 text-center sm:py-4">
			<span className="flex size-16 items-center justify-center rounded-full bg-primary-500 sm:size-20">
				<Check
					className="size-7 text-primary-foreground sm:size-9"
					strokeWidth={3}
					aria-hidden="true"
				/>
			</span>

			<div className="flex flex-col gap-1">
				<h2 className="text-s1 text-foreground sm:text-h5">Funding Successful!</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					You have successfully added
				</p>
				<p className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {result.asset}
				</p>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))} to your wallet
				</p>
			</div>

			<div className="flex w-full flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
				<span className="text-c1 text-muted-foreground sm:text-b3">New Balance</span>
				<span className="text-h5 text-foreground sm:text-h4">
					{balance ? `${formatUsdc(balance.amount)} ${balance.currency}` : "—"}
				</span>
				{balance && (
					<span className="text-c1 text-muted-foreground sm:text-b3">
						~ GHS {formatUsdc(usdcToGhs(balance.amount))}
					</span>
				)}
			</div>

			<div className="flex w-full flex-col items-center gap-4">
				<Button type="button" size="large" className="w-full" onClick={onGoToDashboard}>
					Go to Dashboard
				</Button>
				<button
					type="button"
					onClick={onViewTransactions}
					className="text-b4 font-medium text-foreground hover:underline sm:text-b3"
				>
					View Transactions
				</button>
			</div>
		</div>
	);
}

export { FundingSuccessStep };
