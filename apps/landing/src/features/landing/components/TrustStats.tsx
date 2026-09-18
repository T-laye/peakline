import type { LucideIcon } from "lucide-react";
import { Star, Target } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";

interface Stat {
	value: string;
	description: string;
	icon?: LucideIcon;
	iconClassName?: string;
	/** Only the star is a solid glyph — Target is rings, and filling those
	 * solid would turn it into a plain disc instead of a target mark. */
	filled?: boolean;
}

const STATS: Stat[] = [
	{
		value: "120K+",
		description:
			"Our platform is a trusted choice for money transfers for both individuals & merchants.",
	},
	{
		value: "4.9",
		description:
			"Our high rating proves our platform's quality and positive global user impact.",
		icon: Star,
		iconClassName: "text-secondary-500",
		filled: true,
	},
	{
		value: "89+",
		description:
			"Our global presence ensures reliable, efficient financial solutions.",
		icon: Target,
		iconClassName: "text-primary-500",
	},
];

/** Figma "Credit" (#418:8811), now using the real exported avatar trio
 * (apps/landing/public/images/image-for-stats.png) for the 120K+ stat.
 * Icons matter here: the rating stat is a filled gold star (not the
 * platform's green), and the reach stat is a "target" glyph (concentric
 * circles, per Figma's own "location-define" icon name) — not a map pin. */
function TrustStats() {
	return (
		<section className="custom-container grid grid-cols-1 gap-10 sm:grid-cols-3">
			{STATS.map((stat, i) => (
				<Reveal key={stat.value} delay={i * 100}>
					<div className="flex flex-col gap-5">
						<div className="flex items-center gap-3">
							{stat.icon ? (
								<stat.icon
									className={`size-8 ${stat.iconClassName}`}
									fill={stat.filled ? "currentColor" : "none"}
									aria-hidden="true"
								/>
							) : (
								<Image
									src="/images/image-for-stats.png"
									alt=""
									width={120}
									height={40}
									className="h-10 w-auto"
								/>
							)}
							<span className="text-h3 text-foreground">{stat.value}</span>
						</div>
						<p className="max-w-[306px] text-b3 text-neutral-500">{stat.description}</p>
					</div>
				</Reveal>
			))}
		</section>
	);
}

export { TrustStats };
