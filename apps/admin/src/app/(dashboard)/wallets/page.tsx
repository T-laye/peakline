import type { Metadata } from "next";
import { WalletsList } from "@/features/wallets/components/WalletsList";

export const metadata: Metadata = { title: "Wallets — Peakline Admin" };

export default function WalletsPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Wallets</h1>
				<p className="text-b3 text-muted-foreground">Every Stellar wallet on the platform.</p>
			</div>
			<WalletsList />
		</div>
	);
}
