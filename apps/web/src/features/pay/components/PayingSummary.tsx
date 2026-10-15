import { MerchantAvatar } from "@/features/pay/components/MerchantAvatar";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { PublicPaymentLinkData } from "@/lib/api/types";

/** Compact "who you're paying, how much" strip at the top of each input
 * step, so the payer never loses sight of the amount while switching back
 * and forth with their external wallet app. */
function PayingSummary({ link }: { link: PublicPaymentLinkData }) {
	const amount = Number(link.amount);

	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
			<div className="flex min-w-0 items-center gap-3">
				<MerchantAvatar name={link.businessName} className="size-11 text-b1 sm:size-12" />
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-b3 font-semibold text-foreground sm:text-b2">
						{link.businessName}
					</span>
					<span className="truncate text-c1 text-muted-foreground sm:text-b4">
						{link.title}
					</span>
				</div>
			</div>
			<div className="flex shrink-0 flex-col items-end">
				<span className="text-b2 font-semibold text-foreground sm:text-s2">
					{formatUsdc(amount)} {link.currency}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b4">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</span>
			</div>
		</div>
	);
}

export { PayingSummary };
