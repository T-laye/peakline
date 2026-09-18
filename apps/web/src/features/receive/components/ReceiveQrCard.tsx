"use client";

import QRCode from "react-qr-code";
import { Skeleton } from "@repo/ui/skeleton";
import { Logo } from "@repo/ui/logo";
import { useMyWallet } from "@/features/wallet/hooks";
import { useProfile } from "@/features/profile/hooks";
import { buildReceiveLink } from "@/lib/wallet";

/** Logo-QR-logo-name-caption, matching the mock's boarding-pass-style
 * layout. The QR encodes a same-origin link (`buildReceiveLink`) wrapping
 * the account's own user id, not a wallet address — scanning it with an
 * ordinary phone camera (or Peakline's own "Scan QR" on `/pay`) opens
 * straight into this app's `/send` flow, which resolves that id via the
 * real `GET /wallets/lookup/{userId}` into this same name + the wallet
 * address to pay, then it's the same `POST /transfers/send` flow as typing
 * an address in manually. The name shown below comes from this device's
 * own `useProfile` — same value the payer's own lookup will resolve to. */
function ReceiveQrCard() {
	const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();
	const { data: profile, isLoading: isLoadingProfile } = useProfile();

	if (isLoadingWallet || isLoadingProfile) {
		return (
			<div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
				<Skeleton className="h-44 w-44" />
				<Skeleton className="h-5 w-32" />
			</div>
		);
	}

	if (!wallet || !profile) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background p-8 text-center sm:p-12">
				<p className="text-b3 text-muted-foreground">Your wallet hasn&apos;t been set up yet</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
			<Logo size="sm" />
			<div className="rounded-xl bg-white p-3">
				<QRCode value={buildReceiveLink(profile.id)} size={180} />
			</div>
			<Logo size="sm" />
			<div className="flex flex-col items-center gap-1 text-center">
				{profile && (
					<span className="text-b2 font-semibold text-foreground sm:text-b1">
						{profile.firstName} {profile.lastName}
					</span>
				)}
				<span className="text-c1 text-muted-foreground sm:text-b3">
					Scan to send USDC to this wallet
				</span>
			</div>
		</div>
	);
}

export { ReceiveQrCard };
