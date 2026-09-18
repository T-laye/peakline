import { Reveal } from "@/components/Reveal";
import { Hero } from "./Hero";
import { PoweredByStrip } from "./PoweredByStrip";
import { AboutSection } from "./AboutSection";
import { HowItWorks } from "./HowItWorks";
import { FaqSection } from "./FaqSection";
import { GlobalReachSection } from "./GlobalReachSection";
import { TrustStats } from "./TrustStats";
import { Footer } from "./Footer";

/**
 * Section order mirrors the Figma "LANDING PAGE" frame (node 418-4606) top to
 * bottom. `Navbar` renders inside `Hero` (it's positioned as a floating pill
 * over the hero background there, not a separate full-width section).
 *
 * Every section below the fold is wrapped in `Reveal` for a scroll-triggered
 * fade/slide-in; Hero uses `mode="mount"` internally instead (see Hero.tsx)
 * since it's visible on first paint — nothing to reveal on *scroll* there.
 *
 * The 120px inter-section gap is a desktop value (matches Figma) that reads
 * as a huge dead zone on a ~375px-wide phone — scaled down well below `lg`.
 */
function LandingPage() {
	return (
		<main className="flex flex-col gap-16 overflow-x-hidden bg-background sm:gap-20 lg:gap-[120px]">
			<div className="flex flex-col">
				<Hero />
				<PoweredByStrip />
			</div>
			<Reveal>
				<AboutSection />
			</Reveal>
			<Reveal>
				<HowItWorks />
			</Reveal>
			<Reveal>
				<FaqSection />
			</Reveal>
			<Reveal>
				<GlobalReachSection />
			</Reveal>
			<Reveal>
				<TrustStats />
			</Reveal>
			<Reveal>
				<Footer />
			</Reveal>
		</main>
	);
}

export { LandingPage };
