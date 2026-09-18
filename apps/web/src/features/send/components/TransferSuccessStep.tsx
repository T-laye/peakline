"use client";

import { Check, UserRound } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { SendMoneyResponseData } from "@/lib/api/types";

interface TransferSuccessStepProps {
	result: SendMoneyResponseData;
	onGoToDashboard: () => void;
	onViewTransactions: () => void;
}

/** Step 4a, per the mobile mock: checkmark, amount, a "To" recipient row,
 * then the new balance. `result` is the real `POST /transfers/send`
 * response — `recipientLabel` (whichever identifier resolved the recipient)
 * stands in for a name, same reasoning `ReviewTransferStep` already notes,
 * so a generic person icon is shown here too rather than feeding that
 * label into `UserAvatar`'s initials (a wallet address or phone number
 * doesn't initial-ize into anything meaningful). New Balance reads straight
 * from `useWalletBalance`, refetched via the mutation's own cache
 * invalidation, rather than computed client-side — a real balance now
 * exists to ask for.
 *
 * `min-h-full` + `justify-center` vertically centers this within whatever
 * height the page's own container resolves to, same fix (and same reason)
 * as `TransferProcessingStep`'s — this step previously just sat at the top
 * of a tall mobile screen instead. */
function TransferSuccessStep({
	result,
	onGoToDashboard,
	onViewTransactions,
}: TransferSuccessStepProps) {
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
				<h2 className="text-s1 text-foreground sm:text-h5">Transfer Successful!</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					You have successfully sent
				</p>
				<p className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {result.currency}
				</p>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</p>
			</div>

			<div className="flex w-full flex-col items-start gap-2 text-left">
				<span className="text-c1 text-muted-foreground sm:text-b3">To</span>
				<div className="flex items-center gap-3">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
						<UserRound className="size-4" aria-hidden="true" />
					</span>
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-b3 font-semibold text-foreground sm:text-b2">
							{result.recipientLabel}
						</span>
						<span className="text-c1 text-muted-foreground sm:text-b3">
							{result.type === "internal" ? "Peakline transfer" : "External Stellar transfer"}
						</span>
					</div>
				</div>
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

export { TransferSuccessStep };
