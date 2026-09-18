"use client";

import { ReceiveInfoCard } from "@/features/receive/components/ReceiveInfoCard";
import { useMyWallet } from "@/features/wallet/hooks";
import { useProfile } from "@/features/profile/hooks";
import { buildReceiveLink, maskWalletAddress } from "@/lib/wallet";

/** The "Copy Link"/"Copy Wallet Address" half of the QR Code page's three
 * receive methods (see `QrCodePage`'s own note) — split out from the page
 * itself so that stays a thin server component and keeps its `metadata`
 * export (a client component can't export one). */
function QrCodeReceiveInfo() {
	const { data: wallet } = useMyWallet();
	const { data: profile } = useProfile();
	const walletAddress = wallet?.publicKey ?? "";
	const receiveLink = profile ? buildReceiveLink(profile.id) : "";

	return (
		<div className="flex flex-col gap-4 sm:gap-6">
			<ReceiveInfoCard
				label="Copy Link"
				value={receiveLink || "No wallet yet"}
				copyValue={receiveLink}
			/>
			<ReceiveInfoCard
				label="Copy Wallet Address"
				value={walletAddress ? maskWalletAddress(walletAddress) : "No wallet yet"}
				copyValue={walletAddress}
			/>
		</div>
	);
}

export { QrCodeReceiveInfo };
