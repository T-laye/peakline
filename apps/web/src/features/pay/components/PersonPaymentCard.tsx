"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { MerchantAvatar } from "@/features/pay/components/MerchantAvatar";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { maskWalletAddress } from "@/lib/wallet";

interface PersonPaymentCardProps {
	isLoading: boolean;
	notFound: boolean;
	/** From `GET /wallets/lookup/{userId}` — absent for a bare wallet-address
	 * paste/scan (no lookup possible, see `lib/wallet.ts`'s own note), in
	 * which case the masked address itself stands in as the display name. */
	name?: string;
	address: string;
	onPay: (amount: number) => void;
}

/**
 * The `/pay` route's own version of `PaymentLinkPreviewCard` for a person
 * (or a merchant scanned via their own Receive QR/link, rather than a
 * specific fixed-amount Payment Link) — reported live: this belongs in the
 * Pay section like a merchant payment link does, not a detour through the
 * general-purpose Send flow. Same visual container, but the amount is
 * payer-entered here (there's no fixed amount attached to a plain wallet
 * lookup, unlike a real Payment Link) instead of a fixed display.
 *
 * `onPay` only fires once past validation — the actual PIN confirmation
 * happens in the `SendPinDialog` `PayPage` opens right after, same
 * modal-on-desktop/drawer-on-mobile pattern the Send flow uses.
 */
function PersonPaymentCard({ isLoading, notFound, name, address, onPay }: PersonPaymentCardProps) {
	const { data: balance } = useWalletBalance();
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const numericAmount = Number(amount);
	const amountValid = numericAmount > 0;

	if (isLoading) {
		return (
			<div className="flex min-h-full flex-col items-center justify-center gap-4 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 sm:p-8">
				<Skeleton className="size-16 rounded-full sm:size-20" />
				<Skeleton className="h-5 w-32" />
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="flex min-h-full flex-col items-center justify-center gap-4 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 text-center sm:p-8">
				<p className="text-b3 text-muted-foreground sm:text-b2">
					This link&apos;s recipient couldn&apos;t be found — check the link, or ask them for
					their wallet address instead.
				</p>
			</div>
		);
	}

	const displayName = name ?? maskWalletAddress(address);
	const roleLabel = name ? "Peakline User" : "Wallet Address";

	function handlePay() {
		// Dismiss the on-screen keyboard before anything else — reported live
		// as "typed the amount fine, Pay still did nothing". This card is the
		// only one in this "centered card" family that has a text input in
		// it, and `justify-center` inside `min-h-full` (below) has now also
		// been dropped for that same reason: a still-open keyboard shrinking
		// the visible viewport could put this button below the fold with no
		// way to scroll to it (a plain top-aligned layout never has that
		// problem), and even a reachable tap right after a keyboard closes
		// can be too soon for a *new* dialog to reliably take focus on some
		// mobile browsers. Blurring first sidesteps both.
		(document.activeElement as HTMLElement | null)?.blur();

		if (!amountValid) {
			setError("Enter an amount greater than 0");
			return;
		}
		if (balance && numericAmount > balance.amount) {
			setError("Insufficient balance");
			return;
		}
		setError(null);
		onPay(numericAmount);
	}

	return (
		<div className="flex min-h-full flex-col items-center gap-4 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 text-center sm:p-8">
			<MerchantAvatar name={displayName} />
			<div className="flex flex-col gap-0.5">
				<span className="truncate text-b2 font-semibold text-foreground sm:text-b1">
					{displayName}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">{roleLabel}</span>
			</div>

			<div className="flex w-full flex-col gap-1 rounded-xl border border-secondary-300 bg-background p-4 text-left">
				<span className="text-c1 text-muted-foreground sm:text-b3">Amount</span>
				<div className="flex gap-3">
					<Input
						type="number"
						inputMode="decimal"
						min={0}
						step="any"
						placeholder="0"
						autoFocus
						value={amount}
						onChange={(e) => {
							setAmount(e.target.value);
							setError(null);
						}}
						className="border-none bg-transparent p-0 text-h5 text-foreground shadow-none focus-visible:ring-0 sm:text-h4"
					/>
					<div className="flex h-11 w-24 shrink-0 items-center justify-center rounded-lg border border-input bg-muted text-b1 text-foreground">
						USDC
					</div>
				</div>
				{amountValid && (
					<span className="text-c1 text-muted-foreground sm:text-b3">
						~ GHS {formatUsdc(usdcToGhs(numericAmount))}
					</span>
				)}
			</div>

			{error && <p className="text-c1 text-destructive sm:text-b3">{error}</p>}

			{balance && (
				<div className="flex w-full items-center justify-between text-c1 sm:text-b3">
					<span className="text-muted-foreground">Available Balance</span>
					<span className="font-semibold text-foreground">
						{formatUsdc(balance.amount)} {balance.currency}
					</span>
				</div>
			)}

			<Button type="button" size="large" className="w-full" onClick={handlePay}>
				Pay
			</Button>
		</div>
	);
}

export { PersonPaymentCard };
