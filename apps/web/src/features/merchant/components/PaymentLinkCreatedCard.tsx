"use client";

import { useRef } from "react";
import { Copy, QrCode, Download, Link2 } from "lucide-react";
import QRCodeSvg from "react-qr-code";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@repo/ui/dialog";
import { getShareOptions, copyLink } from "@/lib/share";
import { downloadSvgAsPng } from "@/lib/qrImage";

const SHARE_OPTIONS = getShareOptions("Payment link");

/** A link's own scannable code — for handing a customer the link in person
 * (printed, or shown on a phone screen) when it can't be sent
 * electronically, matching `QrScannerDialog`'s own real camera decoder on
 * the paying side. Its own small dialog rather than reusing `QrCodeCard`'s
 * whole card — that one is the merchant's fixed "my store" code; this one
 * is scoped to a single link's own URL. */
function PaymentLinkQrDialog({ link, title }: { link: string; title: string }) {
	const qrContainerRef = useRef<HTMLDivElement>(null);

	function handleDownload() {
		const svg = qrContainerRef.current?.querySelector("svg");
		if (!svg) return;
		downloadSvgAsPng(svg, "peakline-payment-link-qr-code.png");
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					aria-label="Show QR code for this payment link"
					className="shrink-0 text-muted-foreground hover:text-foreground"
				>
					<QrCode className="size-5" aria-hidden="true" />
				</button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						Let the customer scan this to open and pay this link
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-4">
					<div ref={qrContainerRef} className="rounded-xl bg-white p-4">
						<QRCodeSvg value={link} size={200} />
					</div>
					<Button type="button" variant="outline" className="w-full" onClick={handleDownload}>
						<Download className="size-4" aria-hidden="true" />
						Download QR
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Right-hand panel, per the mock — "No payment link created yet" until
 * `CreatePaymentLinkForm` produces one, then the link + Share via row, plus
 * a QR toggle (`PaymentLinkQrDialog`) next to the copy button for handing a
 * link to a customer in person instead of sending it — pairs with the real
 * camera scanner on Pay's own side.
 *
 * Reused as-is by the Payment Link detail page, which shows the identical
 * panel next to its own receipt-style card — `title` there is "Payment
 * Link" instead of this component's own default, per that mock; a link
 * always exists by the time the detail page renders, so its empty state
 * never shows there.
 */
function PaymentLinkCreatedCard({
	link,
	title = "Payment Link Created",
}: {
	link: string | null;
	title?: string;
}) {
	if (!link) {
		return (
			<div className="flex min-h-full flex-col items-center justify-center rounded-2xl border border-border bg-background p-8 sm:p-12">
				<EmptyState
					icon={Link2}
					title="No payment link created yet"
					description="Fill in the details on the left to create one."
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-6 sm:p-8">
			<h2 className="text-b2 font-semibold text-foreground sm:text-b1">{title}</h2>

			<div className="flex items-center justify-between gap-4 rounded-lg border border-input bg-muted px-3.5 py-2.5">
				<span className="truncate text-b3 text-foreground sm:text-b2">{link}</span>
				<div className="flex shrink-0 items-center gap-3">
					<PaymentLinkQrDialog link={link} title={title} />
					<button
						type="button"
						onClick={() => copyLink(link)}
						aria-label="Copy payment link"
						className="text-muted-foreground hover:text-foreground"
					>
						<Copy className="size-5" aria-hidden="true" />
					</button>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<span className="text-c1 text-muted-foreground sm:text-b3">Share via</span>
				<div className="grid grid-cols-4 gap-3">
					{SHARE_OPTIONS.map(({ label, icon: Icon, iconClassName, onClick }) => (
						<button
							key={label}
							type="button"
							onClick={() => onClick(link)}
							className="flex flex-col items-center gap-2"
						>
							<span className="flex size-14 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted">
								<Icon className={cn("size-5", iconClassName)} aria-hidden="true" />
							</span>
							<span className="text-c2 text-muted-foreground">{label}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export { PaymentLinkCreatedCard };
