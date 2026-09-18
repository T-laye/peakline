import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import { appUrl } from "@/lib/appUrl";

const FLOW_STEPS = [
	"Individual Dashboard → Send Money → QR Payment",
	"Merchant Dashboard → QR Code → Payment Received",
];

/**
 * Figma "Country" section, built from the real exports
 * (apps/landing/public/images/one-wallet-simple-payemnts-desktop.svg,
 * .../one-wallet-simple-payemnts-mobile.svg — confirmed with the user;
 * replaces an earlier Globe-icon/text-badge placeholder). Both are
 * self-contained cards (the world map, dashed connector lines, country flag
 * badges and the merchant payment-card mockup are all baked in) — this
 * component only supplies the surrounding text column.
 *
 * Per the reference screenshots, this section is dark (near-black bg, white
 * text) at desktop width, but reverts to the page's normal light background
 * at mobile width — an actual per-breakpoint design difference, not a
 * light/dark *mode* — so every color here is a plain `lg:` override, not a
 * `dark:` one.
 */
function GlobalReachSection() {
	return (
		<section className="bg-background">
			<div className="custom-container flex flex-col items-center gap-16 py-16 sm:py-20 lg:flex-row lg:justify-between lg:py-24">
				<div className="flex max-w-xl flex-col gap-8">
					<div className="flex flex-col gap-6">
						<h2 className="text-h3 text-foreground sm:text-[3rem] lg:text-white">
							One wallet. Simple payments.
						</h2>
						<p className="text-b1 text-neutral-600 lg:text-neutral-400">
							Whether you&apos;re sending money to someone, receiving a payment
							or paying at a store, Peakline keeps your everyday payments
							simple.
						</p>
						<div className="flex flex-col gap-4">
							{FLOW_STEPS.map((step) => (
								<div key={step} className="flex items-center gap-3">
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 lg:border-white/40">
										<Check className="size-3.5 text-neutral-900 lg:text-white" aria-hidden="true" />
									</span>
									<p className="text-b1 text-neutral-600 lg:text-neutral-300">{step}</p>
								</div>
							))}
						</div>
					</div>

					<Button asChild variant="primary" size="large" className="w-fit rounded-full">
						<Link href={appUrl("/auth/sign-up")}>Get Started</Link>
					</Button>
				</div>

				{/* Plain <img>, not next/image — same reasoning as the other
				 * local-SVG exports in this feature: next/image's optimizer
				 * refuses local SVGs by default, with no resize benefit to gain
				 * from opting in anyway. Desktop/mobile are genuinely different
				 * exports (different card content density), not one asset
				 * scaled — `<picture>` swaps the source at the same breakpoint
				 * the text column itself switches at. */}
				<picture className="w-full max-w-xl">
					<source media="(min-width: 1024px)" srcSet="/images/one-wallet-simple-payemnts-desktop.svg" />
					<img
						src="/images/one-wallet-simple-payemnts-mobile.svg"
						alt="A merchant payment card over a world map, connecting Ghana to Canada and China"
						width={350}
						height={780}
						className="w-full"
					/>
				</picture>
			</div>
		</section>
	);
}

export { GlobalReachSection };
