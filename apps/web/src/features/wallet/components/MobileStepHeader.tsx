"use client";

import { ChevronLeft } from "lucide-react";

/**
 * Back arrow + centered title — the mobile-page header for every dashboard
 * screen (the desktop modal uses `DialogHeader`/`DialogTitle` instead,
 * hence `lg:hidden`). Omit `onBack` for a primary tab-bar destination like
 * /wallet, which has no "back" to go to — just the centered title.
 *
 * `sticky top-0`, like a native app's nav bar — stays put as the page's own
 * content scrolls underneath it, so the current section is never in doubt.
 * `DashboardLayout`'s mobile content column is the actual scrolling area
 * (there's no inner `overflow-auto` wrapper) and gives it `p-4`; the
 * negative margins here cancel exactly that, bleeding this bar out to the
 * true viewport edges so it reads as its own fixed bar rather than an inset
 * card once it's stuck, then `px-4`/`pt-4` put the same space back as this
 * element's own padding. `pt-[calc(...+1rem)]` also clears a notch/status
 * bar when installed as a PWA — same `env(safe-area-inset-*)` trick
 * `BottomTabBar` uses for the bottom edge.
 */
function MobileStepHeader({
	title,
	onBack,
}: {
	title: string;
	onBack?: () => void;
}) {
	return (
		<div className="sticky top-0 z-30 -mx-4 -mt-4 flex items-center justify-center border-b border-border bg-background px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 lg:hidden">
			{onBack && (
				<button
					type="button"
					onClick={onBack}
					aria-label="Back"
					className="absolute left-4 text-foreground"
				>
					<ChevronLeft className="size-6" aria-hidden="true" />
				</button>
			)}
			<h1 className="text-s1 text-foreground">{title}</h1>
		</div>
	);
}

export { MobileStepHeader };
