/** Figma "#426:19103" — an infinite marquee (confirmed with the user). The
 * track renders the label list twice back to back and `.animate-marquee`
 * (apps/landing/src/app/globals.css) slides it exactly one copy-width left
 * on a loop, so the seam between the two copies is never visible.
 *
 * `relative` (otherwise unnecessary here) matters: Hero is `position:
 * relative`, which promotes its whole stacking-context unit above any
 * *non-positioned* sibling regardless of DOM order — without this, Hero's
 * negative-margin overlap (see Hero.tsx) painted on top of this strip
 * instead of being covered by it. Making this positioned too puts both
 * back in the same "positioned, z-index:auto" bucket, where DOM order (this
 * comes after Hero) decides — so this correctly paints over the overlap. */
function PoweredByStrip() {
	return (
		<div className="relative overflow-hidden bg-[#04684C] py-5">
			<div className="flex w-max animate-marquee">
				<MarqueeTrack />
				<MarqueeTrack aria-hidden="true" />
			</div>
		</div>
	);
}

function MarqueeTrack({ "aria-hidden": ariaHidden }: { "aria-hidden"?: "true" }) {
	return (
		<div className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={ariaHidden}>
			{Array.from({ length: 6 }).map((_, i) => (
				<span key={i} className="text-b1 whitespace-nowrap text-white">
					Powered by Stellar
				</span>
			))}
		</div>
	);
}

export { PoweredByStrip };
