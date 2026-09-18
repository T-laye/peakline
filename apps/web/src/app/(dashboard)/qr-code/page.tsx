import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { QrCodeCard } from "@/features/merchant/components/QrCodeCard";
import { QrCodeReceiveInfo } from "@/features/merchant/components/QrCodeReceiveInfo";

export const metadata: Metadata = {
	title: "My QR Code — Peakline",
};

// Merchant-only — now a primary sidebar/drawer destination ("My QR Code"),
// not just reachable via Overview's "Show QR" quick action, so no back
// arrow (same as Wallet/Payments/Payment Links). The page's own H1 reads
// "QR Code" (not "My QR Code") per the mock — the nav item and the page
// title are allowed to differ, same distinction the mock itself draws.
//
// No `MobileStepHeader` here — `MerchantMobileTopBar` already shows
// "My QR Code" as a back+title+hamburger bar for this exact route, same as
// `/payments`.
//
// Three ways to receive, same three as an individual account's own Receive
// page: the QR itself (`QrCodeCard`), the same link as text ("Copy Link"),
// and the bare wallet address for anyone who needs to paste it into a
// non-Peakline wallet instead — both split into `QrCodeReceiveInfo` so this
// page can stay a server component (and keep its `metadata` export above).
export default function QrCodePage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader title="QR Code" subtitle="Receive payments via your QR code" />
			<div className="grid grid-cols-1 gap-4 lg:max-w-3xl lg:grid-cols-2 lg:gap-6">
				<QrCodeCard />
				<QrCodeReceiveInfo />
			</div>
		</div>
	);
}
