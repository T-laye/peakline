"use client";

import { Check, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/button";
import { MerchantAvatar } from "@/features/pay/components/MerchantAvatar";
import { CopyableDetailRow } from "@/features/pay/components/CopyableDetailRow";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { stellarExplorerTxUrl, truncateMiddle } from "@/lib/pay";
import type { ExternalPaymentVerificationData, PublicPaymentLinkData } from "@/lib/api/types";

interface ExternalPaymentVerifiedStepProps {
	link: PublicPaymentLinkData;
	verification: ExternalPaymentVerificationData;
	onGoToDashboard: () => void;
}

/** Same layout as `PaymentSuccessStep`, but with no New Balance card: the
 * money left an external wallet, so the payer's Peakline balance hasn't
 * changed. Shows the on-chain proof instead (sender + hash + explorer). */
function ExternalPaymentVerifiedStep({
	link,
	verification,
	onGoToDashboard,
}: ExternalPaymentVerifiedStepProps) {
	const amount = Number(verification.receivedAmount);

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
				<h2 className="text-s1 text-foreground sm:text-h5">Payment Verified!</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					Your external wallet payment was confirmed
				</p>
				<p className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {verification.currency}
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
				<span className="text-c1 text-muted-foreground sm:text-b3">Merchant</span>
			</div>

			<div className="flex w-full flex-col gap-4 rounded-xl border border-secondary-300 bg-secondary-100 p-4 text-left sm:p-5">
				<CopyableDetailRow
					label="Paid from"
					value={truncateMiddle(verification.senderAddress, 8, 8)}
					copyValue={verification.senderAddress}
				/>
				<CopyableDetailRow
					label="Transaction hash"
					value={truncateMiddle(verification.stellarTxHash, 10, 10)}
					copyValue={verification.stellarTxHash}
				/>
				<a
					href={stellarExplorerTxUrl(verification.stellarTxHash)}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 self-start text-b4 font-medium text-primary-600 hover:underline"
				>
					View on Stellar Expert
					<ExternalLink className="size-4" aria-hidden="true" />
				</a>
			</div>

			<Button type="button" size="large" className="w-full" onClick={onGoToDashboard}>
				Go to Dashboard
			</Button>
		</div>
	);
}

export { ExternalPaymentVerifiedStep };
