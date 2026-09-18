"use client";

import { Button } from "@repo/ui/button";
import { MerchantAvatar } from "@/features/pay/components/MerchantAvatar";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { PublicPaymentLinkData } from "@/lib/api/types";

interface PaymentLinkPreviewCardProps {
	link: PublicPaymentLinkData | null;
	onContinue: () => void;
	onChangeCode: () => void;
}

const STATUS_MESSAGE: Record<"expired" | "cancelled", string> = {
	expired: "This payment link has expired and can no longer be paid.",
	cancelled: "This payment link was cancelled by the merchant.",
};

/** Right-hand card, per the mock's original shape ("No Merchant Scanned"
 * until one is found) — now showing a real payment link's fixed amount
 * instead of a payer-entered one, since that's all `GET /pay/{code}`
 * returns (no free-form "pay this merchant X" endpoint exists). `min-h-full`
 * keeps its height matching the code-entry card next to it on desktop,
 * empty state or not. */
function PaymentLinkPreviewCard({ link, onContinue, onChangeCode }: PaymentLinkPreviewCardProps) {
	if (!link) {
		return (
			<div className="flex min-h-full flex-col items-center justify-center gap-4 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 text-center sm:p-8">
				<p className="text-b3 text-muted-foreground sm:text-b2">No Payment Link Found</p>
			</div>
		);
	}

	const amount = Number(link.amount);
	const payable = link.status === "active";

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-4 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 text-center sm:p-8">
			<MerchantAvatar name={link.businessName} />
			<div className="flex flex-col gap-0.5">
				<span className="text-b2 font-semibold text-foreground sm:text-b1">
					{link.businessName}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">Merchant</span>
			</div>

			<div className="flex w-full flex-col gap-1 rounded-xl border border-secondary-300 bg-background p-4">
				<span className="text-c1 text-muted-foreground sm:text-b3">{link.title}</span>
				<span className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {link.currency}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</span>
				{link.description && (
					<p className="text-c1 text-muted-foreground sm:text-b3">{link.description}</p>
				)}
			</div>

			{!payable && (
				<p className="text-c1 text-destructive sm:text-b3">
					{STATUS_MESSAGE[link.status as "expired" | "cancelled"]}
				</p>
			)}

			<div className="flex w-full flex-col items-center gap-3">
				<Button
					type="button"
					size="large"
					className="w-full"
					disabled={!payable}
					onClick={onContinue}
				>
					Continue
				</Button>
				<button
					type="button"
					onClick={onChangeCode}
					className="text-b4 font-medium text-muted-foreground underline hover:text-foreground"
				>
					Look up a different link
				</button>
			</div>
		</div>
	);
}

export { PaymentLinkPreviewCard };
