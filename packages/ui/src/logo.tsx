import logoSrc from "./assets/logo.svg";
import darkLogoSrc from "./assets/white-logo.png";
import { cn } from "./lib/utils";

/**
 * Plain <img>, not next/image — this file is bundled into every app that
 * imports it, and `next/image` isn't resolvable from inside this package
 * under pnpm's strict linking (see CLAUDE.md). Wrap it in your own
 * `next/link` where you need it to be clickable.
 */
const SIZE_CLASS = {
	sm: "h-5",
	md: "h-7",
	lg: "h-8 sm:h-13",
	xl: "h-15",
} as const;

// Two separate exports, not one recolored via CSS — the mark's colors are
// baked into a raster image (see CLAUDE.md's "Known issues"), not vector
// paths, so there's nothing a `filter`/`currentColor` trick could invert.
const LOGO_SRC = {
	default: logoSrc,
	/** For a dark-background context (e.g. the merchant sidebar). */
	dark: darkLogoSrc,
} as const;

interface LogoProps extends Omit<React.ComponentProps<"img">, "src" | "alt"> {
	size?: keyof typeof SIZE_CLASS;
	variant?: keyof typeof LOGO_SRC;
}

function Logo({ size = "md", variant = "default", className, ...props }: LogoProps) {
	return (
		<img
			src={LOGO_SRC[variant].src}
			alt="Peakline"
			className={cn("w-auto", SIZE_CLASS[size], className)}
			{...props}
		/>
	);
}

export { Logo };
export type { LogoProps };
