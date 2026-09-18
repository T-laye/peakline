"use client";

import { useId, useState } from "react";
import { Send, ArrowDown, HandCoins } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Reveal } from "@/components/Reveal";

type Audience = "individuals" | "businesses";

interface Feature {
	icon: typeof Send;
	title: string;
	description: string;
}

const HEADING = "Send, receive and collect payments — all in one place.";
const SUBCOPY =
	"Peakline makes digital payments simpler for individuals and businesses in Ghana. Send money, receive payments, pay with QR codes and collect with payment links — all from one platform.";

// Both tabs reuse the same three icons — only the copy and the phone
// screenshot change between Individuals/Businesses (confirmed against the
// reference: neither the heading/subcopy nor the icon set differs).
const FEATURES: Record<Audience, Feature[]> = {
	individuals: [
		{ icon: Send, title: "Send Money", description: "Send to people using a phone number, username or wallet address." },
		{ icon: ArrowDown, title: "Receive Money", description: "Share your payment details and get paid easily." },
		{ icon: HandCoins, title: "Request payment", description: "Ask someone to pay you without complicated instructions." },
	],
	businesses: [
		{ icon: Send, title: "Accept payments", description: "Get paid through QR codes and payment links." },
		{ icon: ArrowDown, title: "Create payment links", description: "Create a payment request with an amount, description and expiry." },
		{ icon: HandCoins, title: "Share your QR", description: "Give customers a simple way to pay in-store." },
	],
};

const IMAGE_SRC: Record<Audience, string> = {
	individuals: "/images/how-it-works-individual.svg",
	businesses: "/images/how-it-works-businesses.svg",
};

/**
 * Figma "How It Works!" (#426:17808), built from the real exports
 * (apps/landing/public/images/how-it-works-individual.svg,
 * .../how-it-works-businesses.svg — confirmed with the user; the light gray
 * offset panel behind the phone is already baked into each image, not a
 * separate element). Both are correctly clipped as exported — no
 * viewBox/content-bounds mismatch like hero-img.svg had.
 *
 * The Individuals/Businesses switcher is a plain tab pair, not a segmented
 * toggle/switch — the active tab gets a soft tint background, not a solid
 * filled pill (an earlier pass here used the switch look; fixed per
 * reference).
 */
function HowItWorks() {
	const [audience, setAudience] = useState<Audience>("individuals");
	const tabListId = useId();

	return (
		<section id="how-it-works" className="custom-container flex flex-col items-center gap-14">
			<div
				role="tablist"
				aria-label="Peakline for individuals or businesses"
				className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1.5"
			>
				<Tab id={`${tabListId}-individuals`} active={audience === "individuals"} onClick={() => setAudience("individuals")}>
					For Individuals
				</Tab>
				<Tab id={`${tabListId}-businesses`} active={audience === "businesses"} onClick={() => setAudience("businesses")}>
					For Businesses
				</Tab>
			</div>

			<div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-center">
				<div className="flex max-w-lg flex-col gap-10">
					<div className="flex flex-col gap-4">
						<h2 className="text-h3 text-foreground sm:text-[3rem]">{HEADING}</h2>
						<p className="text-b1 text-neutral-600">{SUBCOPY}</p>
					</div>

					<div className="flex flex-col gap-8">
						{FEATURES[audience].map(({ icon: Icon, title, description }, i) => (
							<Reveal key={title} delay={i * 80}>
								<div className="flex items-start gap-4">
									<span className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-[#CEE5DE]/30">
										<Icon className="size-6 text-primary-500" aria-hidden="true" />
									</span>
									<div className="flex flex-col gap-1">
										<p className="text-s1 text-foreground">{title}</p>
										<p className="text-b1 text-neutral-500">{description}</p>
									</div>
								</div>
							</Reveal>
						))}
					</div>
				</div>

				{/* Plain <img>, not next/image — same reasoning as Hero.tsx's
				 * phone graphic: local SVG, next/image's optimizer refuses
				 * those by default with no resize benefit to gain anyway. */}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={IMAGE_SRC[audience]}
					alt={
						audience === "individuals"
							? "The Peakline app dashboard: available balance, quick actions and recent transactions"
							: "The Peakline app's Receive screen: a QR code, payment link and wallet address to share"
					}
					width={576}
					height={717}
					className="w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[576px]"
				/>
			</div>
		</section>
	);
}

function Tab({
	id,
	active,
	onClick,
	children,
}: {
	id: string;
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			id={id}
			type="button"
			role="tab"
			aria-selected={active}
			onClick={onClick}
			className={cn(
				"rounded-full px-4 py-2.5 text-b3 whitespace-nowrap transition-colors sm:px-6 sm:py-3 sm:text-s2",
				active ? "bg-primary-100 text-primary-700" : "text-neutral-900 hover:bg-neutral-50",
			)}
		>
			{children}
		</button>
	);
}

export { HowItWorks };
