import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { appUrl } from "@/lib/appUrl";
import { Reveal } from "@/components/Reveal";
import { Navbar } from "./Navbar";

/** Fraction of hero-img.svg's natural height (910) that's actually visible
 * before the crop — measured against the reference screenshot rather than
 * guessed: the design shows the phone down to the "Available Balance" card
 * and cuts off right before its Add Money/Withdraw buttons, which sits at
 * ~39% of the full image's rendered height. */
const HERO_IMG_VISIBLE_RATIO = "883 / 355";

/**
 * Figma "Hero Section" (#418:4607), now built from the real exports
 * (apps/landing/public/images/hero-background-img.png,
 * .../hero-img.svg — confirmed with the user) instead of the earlier
 * placeholder gradients/divs.
 *
 * `hero-img.svg` is one flattened graphic — phone screenshot, both floating
 * stat cards, the growth badge and the avatar-stack chip all baked into a
 * single image — but as exported its root `<svg>` declared
 * `viewBox="0 0 883 339"` while its actual shapes run to y≈898; Figma wrote
 * the wrong export bounds, and used at that viewBox it would've clipped
 * ~70% of the image. Patched the file's root width/height/viewBox to
 * 883×910 (the real content bounds) rather than working around it in CSS.
 */
function Hero() {
	return (
		<section className="relative bg-[#F3F3F5]">
			<Image
				src="/images/hero-background-img.png"
				alt=""
				fill
				priority
				className="object-cover object-top"
			/>

			{/* Fixed, not in-flow: stays pinned through the whole page, not just
			 * the hero. Its old flow-slot is gone, so the content column below
			 * makes up the difference with its own top padding instead of the
			 * `mt-16` that used to sit right after the in-flow navbar. */}
			<div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6 sm:px-6 lg:px-8">
				<div className="w-full max-w-7xl">
					<Navbar />
				</div>
			</div>

			<div className="custom-container relative flex flex-col items-center gap-16 pt-32 text-center sm:pt-36 lg:pt-40">
				<div className="flex flex-col items-center gap-6">
					<div className="flex flex-col items-center gap-3">
						<Reveal mode="mount">
							<span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 py-1 pr-3 pl-1 text-b4 text-neutral-900">
								<span className="flex size-8 items-center justify-center rounded-full bg-background">
									<ShieldCheck className="size-4 text-primary-500" aria-hidden="true" />
								</span>
								One Wallet, Simple Payments
							</span>
						</Reveal>

						<Reveal mode="mount" delay={100} className="flex max-w-4xl flex-col gap-4">
							{/* Figma's H1 style is textCase: TITLE — `capitalize`
							 * renders that without changing the copy's actual case. */}
							<h1 className="text-h2 capitalize text-foreground sm:text-[3.375rem] sm:leading-[1.24]">
								Simpler payments for people and growing businesses.
							</h1>
							<p className="mx-auto max-w-2xl text-b1 text-neutral-500 sm:text-b2">
								Peakline makes digital payments simpler for individuals and
								businesses in Ghana. Send money, receive payments, pay with QR
								codes and collect with payment links — all from one platform.
							</p>
						</Reveal>
					</div>

					<Reveal
						mode="mount"
						delay={200}
						className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center"
					>
						<Button
							asChild
							variant="primary"
							size="large"
							className="w-full rounded-full sm:w-auto"
						>
							<Link href={appUrl("/auth/sign-up")}>Get Started</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							size="large"
							className="w-full rounded-full border-secondary-500 shadow-[4px_11px_23px_rgba(0,0,0,0.06)] sm:w-auto"
						>
							<Link href="#how-it-works">Explore how it works</Link>
						</Button>
					</Reveal>
				</div>

				{/* Deliberately not `w-full`/contained — on mobile the reference
				 * design lets this bleed past the viewport edges (the phone and
				 * both floating cards run off both sides). Height is clipped to
				 * `HERO_IMG_VISIBLE_RATIO` (see above) rather than the image's
				 * own natural aspect ratio — the design only ever shows the top
				 * slice of this graphic, with the "cloud" fade blending that cut
				 * into the background instead of a hard edge.
				 *
				 * The negative bottom margin pulls it past the section's own
				 * (no-longer-clipped — `overflow-hidden` was removed from the
				 * section) bottom edge, so it visually overlaps the top of
				 * PoweredByStrip rather than merely touching it; that strip's
				 * opaque background then covers the overlapped sliver, since it
				 * paints later in the same normal-flow stacking order. Kept
				 * small on purpose — enough to read as an intentional overlap,
				 * not so much that it swallows the "Available Balance" card the
				 * crop is supposed to end on. */}
				<Reveal
					mode="mount"
					delay={300}
					className="relative -mb-3 w-[560px] max-w-none overflow-hidden sm:-mb-4 sm:w-[680px] lg:-mb-6 lg:w-[760px]"
					style={{ aspectRatio: HERO_IMG_VISIBLE_RATIO }}
				>
					{/* Plain <img>, not next/image: this is a (large, see the
					 * repo's "known issues") local SVG, and next/image's
					 * optimizer refuses local SVGs by default
					 * (`images.dangerouslyAllowSVG`) with no raster-resize
					 * benefit to gain from opting in anyway. */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/images/hero-img.svg"
						alt="The Peakline app: a merchant dashboard showing available balance, recent activity and payment totals"
						width={883}
						height={910}
						className="w-full"
					/>

					{/* The "cloud" fade (Figma #418:4844) — softens the crop
					 * instead of a visible clip line. No backdrop-blur: it made
					 * the fade read as smudged rather than crisp. */}
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
						style={{
							background:
								"linear-gradient(180deg, rgba(243,243,245,0) 0%, rgba(243,243,245,0.3) 48%, rgba(243,243,245,1) 100%)",
						}}
					/>
				</Reveal>
			</div>
		</section>
	);
}

export { Hero };
