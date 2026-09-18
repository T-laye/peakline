"use client";

import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ReceiveQrCard } from "@/features/receive/components/ReceiveQrCard";
import { ReceiveInfoCard } from "@/features/receive/components/ReceiveInfoCard";
import { useMyWallet } from "@/features/wallet/hooks";
import { useProfile } from "@/features/profile/hooks";
import { buildReceiveLink, maskWalletAddress } from "@/lib/wallet";

// Three ways to receive, same three for a merchant's own QR Code page
// (`QrCodePage`): the QR itself, the same link as text ("Copy Link" — no
// real "payment link"/"payment request" backend concept for either account
// type, just this app's own `buildReceiveLink` wrapping the account's user
// id; see that function's own note), and the bare wallet address for
// anyone who needs to paste it into a non-Peakline wallet instead.
export default function ReceivePage() {
	const router = useRouter();
	const { data: wallet } = useMyWallet();
	const { data: profile } = useProfile();
	const walletAddress = wallet?.publicKey ?? "";
	const receiveLink = profile ? buildReceiveLink(profile.id) : "";

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Receive" onBack={() => router.back()} />
			<PageHeader
				title="Receive"
				subtitle="Scan or share your QR code or wallet address to receive payments."
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<ReceiveQrCard />
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
			</div>
		</div>
	);
}
