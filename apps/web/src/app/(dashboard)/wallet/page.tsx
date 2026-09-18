import type { Metadata } from "next";
import { WalletOverview } from "@/features/wallet/components/WalletOverview";

export const metadata: Metadata = {
	title: "My Wallet — Peakline",
};

export default function WalletPage() {
	return <WalletOverview />;
}
