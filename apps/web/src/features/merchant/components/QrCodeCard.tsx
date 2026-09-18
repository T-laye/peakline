"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { QrCode, Camera, Download, Wallet, Building2 } from "lucide-react";
import QRCodeSvg from "react-qr-code";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Logo } from "@repo/ui/logo";
import { toast } from "@repo/ui/sonner";
import { downloadSvgAsPng } from "@/lib/qrImage";
import { useMyWallet } from "@/features/wallet/hooks";
import { useMyBusiness } from "@/features/business/hooks";
import { useProfile } from "@/features/profile/hooks";
import { buildReceiveLink } from "@/lib/wallet";

/**
 * Two states, per the mock: a plain "Generate" prompt, then the actual QR
 * once requested. The QR encodes a same-origin link (`buildReceiveLink`)
 * wrapping the account's own user id (the business owner's, per
 * `GET /wallets/lookup/{userId}`'s own description — it resolves to the
 * business name automatically for a merchant account), not a wallet
 * address — scanning it with an ordinary phone camera (or Peakline's own
 * "Scan QR" on `/pay`) opens straight into this app's `/send` flow, which
 * resolves that id into the business name + wallet address to pay, then
 * it's the same real `POST /transfers/send` this app's own Send flow
 * already uses. Trades away raw interop with non-Peakline Stellar wallets
 * (they'd see a URL, not a payable address) for a one-scan path straight
 * into this app's own Send flow with the business name already confirmed —
 * this same page's own "Copy Wallet Address"/"Copy Link" rows (see
 * `QrCodeReceiveInfo`) still offer the bare address for anyone who
 * genuinely needs that. Both cards stay at a fixed max width and hug the
 * left edge of the page (not stretched full-width, not centered in the
 * leftover space) — the mock's own card is visibly narrower than the page
 * around it, same treatment either state. "Download QR" is real (see
 * `downloadSvgAsPng`) — "Scan QR" has no real camera access, and scanning
 * one's own store code has no obvious purpose anyway (the mock doesn't
 * explain who'd use it or for what), so it's a clear toast rather than
 * invented behavior.
 */
function QrCodeCard() {
	const [generated, setGenerated] = useState(false);
	const qrContainerRef = useRef<HTMLDivElement>(null);
	const { data: business, isLoading: isLoadingBusiness } = useMyBusiness();
	const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();
	const { data: profile } = useProfile();

	function handleDownload() {
		const svg = qrContainerRef.current?.querySelector("svg");
		if (!svg) {
			toast.error("Couldn't generate the QR image");
			return;
		}
		downloadSvgAsPng(svg, "peakline-store-qr-code.png");
	}

	if (isLoadingBusiness || isLoadingWallet) {
		return (
			<div className="flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-border bg-background p-8 sm:p-12">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-52 w-52" />
			</div>
		);
	}

	if (!business) {
		return (
			<div className="max-w-xl rounded-2xl border border-border bg-background">
				<EmptyState
					icon={Building2}
					title="No business yet"
					description="Add your business information before generating a QR code."
					action={
						<Button asChild size="large">
							<Link href="/account">Go to Account</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	if (!wallet || !profile) {
		// Shouldn't normally happen — sign-up's own `SetPinForm` already
		// creates the account's wallet (see `useMyWallet`'s own note), and
		// `useProfile` is fetched app-wide well before this page — but the
		// types allow it.
		return (
			<div className="max-w-xl rounded-2xl border border-border bg-background">
				<EmptyState
					icon={Wallet}
					title="No wallet yet"
					description="Your wallet hasn't been set up yet — check the Wallet page before generating a QR code."
					action={
						<Button asChild size="large">
							<Link href="/wallet">Go to Wallet</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	if (!generated) {
		return (
			<div className="flex max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-background p-8 text-center sm:p-12">
				<div className="flex flex-col gap-2">
					<h2 className="text-h5 text-foreground">Generate a QR code for your store</h2>
					<p className="text-b3 text-muted-foreground">
						Your customers can easily scan this to make a payment
					</p>
				</div>
				<Button type="button" size="large" onClick={() => setGenerated(true)}>
					<QrCode className="size-4" aria-hidden="true" />
					Generate QR
				</Button>
			</div>
		);
	}

	return (
		<div className="flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
			<span className="text-h5 text-foreground">{business.name}</span>
			<div ref={qrContainerRef} className="rounded-xl bg-white p-4">
				<QRCodeSvg value={buildReceiveLink(profile.id)} size={200} />
			</div>
			<Logo size="sm" />
			<p className="text-b3 text-muted-foreground">
				Customers can scan this to send USDC to your business wallet
			</p>

			<div className="flex w-full flex-col gap-3 sm:flex-row">
				<Button
					type="button"
					className="w-full"
					onClick={() => toast.info("Camera scanning isn't available in this demo")}
				>
					<Camera className="size-4" aria-hidden="true" />
					Scan QR
				</Button>
				<Button type="button" variant="outline" className="w-full" onClick={handleDownload}>
					<Download className="size-4" aria-hidden="true" />
					Download QR
				</Button>
			</div>
		</div>
	);
}

export { QrCodeCard };
