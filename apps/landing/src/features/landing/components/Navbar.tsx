"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Logo } from "@repo/ui/logo";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { appUrl } from "@/lib/appUrl";

/** Figma's exact hamburger glyph (3 unequal-width bars) — not lucide's
 * `Menu` (3 equal bars). Matches apps/landing/public/images/ham-menu-icon.svg
 * (inlined, not an <img>, so `currentColor` can follow the button's text
 * color instead of being baked in as a fixed white fill). */
function HamburgerIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M10 7C10 6.44772 10.4477 6 11 6H19C19.5523 6 20 6.44772 20 7C20 7.55228 19.5523 8 19 8H11C10.4477 8 10 7.55228 10 7ZM4 12C4 11.4477 4.44772 11 5 11H19C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H5C4.44772 13 4 12.5523 4 12ZM4 17C4 16.4477 4.44772 16 5 16H13C13.5523 16 14 16.4477 14 17C14 17.5523 13.5523 18 13 18H5C4.44772 18 4 17.5523 4 17Z"
				fill="currentColor"
			/>
		</svg>
	);
}

const NAV_LINKS = [
	{ label: "Home", href: "#" },
	{ label: "About", href: "#about" },
	{ label: "How it works", href: "#how-it-works" },
	{ label: "Services", href: "#services" },
];

/**
 * Floating dark pill over the hero background (Figma "Navbar", #418:4821) —
 * not a full-width bar, and not sticky (nothing in the fetched frame data
 * indicated scroll-pinning). Below `lg`, the export collapses the links +
 * both auth CTAs into a single menu toggle (the reference mobile screenshot
 * shows only the logo and a green circular hamburger button) — there's no
 * separate mobile-menu frame in the fetched Figma data, so the open state
 * (a stacked panel with the same links/CTAs) is this component's own design,
 * not a 1:1 trace.
 */
function Navbar() {
	const [open, setOpen] = useState(false);

	return (
		<nav className="relative mx-auto w-full max-w-[1240px]">
			<div className="flex items-center justify-between gap-6 rounded-full bg-neutral-900 px-4 py-3 sm:px-8">
				<Link href="/" aria-label="Peakline home">
					{/* Figma's navbar logo export is 117×39 at the 1440 desktop
					 * frame — noticeably bigger than @repo/ui/logo's preset size
					 * steps, so this is a direct height override rather than a
					 * named size. */}
					<Logo variant="dark" className="h-8 sm:h-[39px]" />
				</Link>

				<div className="hidden items-center gap-10 lg:flex">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.label}
							href={link.href}
							className="text-b1 text-white/90 transition-colors hover:text-white"
						>
							{link.label}
						</Link>
					))}
				</div>

				<div className="hidden items-center gap-5 lg:flex">
					<Button
						asChild
						variant="outline"
						size="medium"
						className="rounded-full border-secondary-500 bg-transparent text-white hover:bg-white/10"
					>
						<Link href={appUrl("/auth/sign-in")}>Log in</Link>
					</Button>
					<Button asChild variant="primary" size="medium" className="rounded-full">
						<Link href={appUrl("/auth/sign-up")}>Get Started</Link>
					</Button>
				</div>

				<Button
					variant="primary"
					size="medium"
					iconOnly
					aria-label={open ? "Close menu" : "Open menu"}
					aria-expanded={open}
					onClick={() => setOpen((v) => !v)}
					className="rounded-full lg:hidden"
				>
					{open ? <X className="size-5" aria-hidden="true" /> : <HamburgerIcon className="size-5" aria-hidden="true" />}
				</Button>
			</div>

			{/* Always mounted, not `{open && ...}` — that would unmount instantly
			 * on close and skip the closing half of the animation entirely. A
			 * plain `transition` (not a tw-animate-css `animate-in`/`animate-out`
			 * keyframe) is what makes that safe: transitions only fire on a
			 * *change* from the already-rendered state, so this sits inert at
			 * max-h-0/opacity-0 through the initial render with nothing playing
			 * — a keyframe animation would instead fire its "closed" pose the
			 * moment the class first appears, flashing on every page load. */}
			<div
				className={cn(
					"absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-3xl bg-neutral-900 transition-[max-height,opacity] duration-300 ease-out lg:hidden",
					open ? "max-h-[26rem] opacity-100" : "pointer-events-none max-h-0 opacity-0",
				)}
				aria-hidden={!open}
			>
				<div className="flex flex-col gap-1 p-4">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.label}
							href={link.href}
							tabIndex={open ? undefined : -1}
							onClick={() => setOpen(false)}
							className="rounded-xl px-4 py-3 text-b1 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
						>
							{link.label}
						</Link>
					))}
					<div className="mt-2 flex flex-col gap-3 px-4">
						<Button
							asChild
							variant="outline"
							size="medium"
							tabIndex={open ? undefined : -1}
							className="rounded-full border-secondary-500 bg-transparent text-white hover:bg-white/10"
						>
							<Link href={appUrl("/auth/sign-in")}>Log in</Link>
						</Button>
						<Button
							asChild
							variant="primary"
							size="medium"
							tabIndex={open ? undefined : -1}
							className="rounded-full"
						>
							<Link href={appUrl("/auth/sign-up")}>Get Started</Link>
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}

export { Navbar };
