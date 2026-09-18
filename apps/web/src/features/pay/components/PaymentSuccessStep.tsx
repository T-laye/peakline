"use client";

import { Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import { MerchantAvatar } from "@/features/pay/components/MerchantAvatar";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { PublicPaymentLinkData, SendMoneyResponseData } from "@/lib/api/types";

interface PaymentSuccessStepProps {
	link: PublicPaymentLinkData;
	result: SendMoneyResponseData;
	onGoToDashboard: () => void;
	onViewTransactions: () => void;
}

/** Matches the mock: checkmark, amount, merchant, new balance. `result` is
 * the real `POST /transfers/send` response; `link` still supplies the
 * merchant's name/avatar since the transfer response itself only carries
 * `recipientLabel` (the wallet address paid, not a business name). New
 * Balance reads straight from `useWalletBalance`, refetched via the
 * mutation's own cache invalidation, rather than computed client-side —
 * same reasoning as `TransferSuccessStep`'s real version.
 *
 * `min-h-full` + `justify-center` vertically centers this within whatever
 * height the page's own container resolves to, same fix as
 * `PaymentProcessingStep`'s. */
function PaymentSuccessStep({
	link,
	result,
	onGoToDashboard,
	onViewTransactions,
}: PaymentSuccessStepProps) {
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
				<h2 className="text-s1 text-foreground sm:text-h5">Payment Successful!</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					You have successfully paid
				</p>
				<p className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {result.currency}
				</p>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</p>
			</div>

			<div className="flex flex-col items-center gap-2">
				<MerchantAvatar name={link.businessName} />
				<span className="text-b3 font-semibold text-foreground sm:text-b2">
					{link.businessName}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">
					{link.recipientRoleLabel ?? "Merchant"}
				</span>
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

export { PaymentSuccessStep };
