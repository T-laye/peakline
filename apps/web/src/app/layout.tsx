import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@repo/ui/sonner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
});

const SITE_NAME = "Peakline";
const SITE_DESCRIPTION =
	"A simple, secure digital wallet for Ghana — send, receive and pay with USDC on Stellar, for individuals and merchants alike.";

export const metadata: Metadata = {
	metadataBase: SITE_URL,
	// Not a title.template: every page under app/ already sets its own full
	// "X — Peakline" string (see e.g. auth/sign-up/page.tsx) rather than
	// opting into a parent template, so a template here would double up to
	// "X — Peakline — Peakline" on every one of them.
	title: `${SITE_NAME} — Pay. Receive. Grow.`,
	description: SITE_DESCRIPTION,
	manifest: "/favicon/site.webmanifest",
	icons: {
		icon: [
			{ url: "/favicon/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: "/favicon/apple-touch-icon.png",
	},
	openGraph: {
		title: `${SITE_NAME} — Pay. Receive. Grow.`,
		description: SITE_DESCRIPTION,
		url: "/",
		siteName: SITE_NAME,
		locale: "en_US",
		type: "website",
		// opengraph-image.tsx (this directory) supplies the image itself —
		// Next.js wires it into these tags automatically.
	},
	twitter: {
		card: "summary_large_image",
		title: `${SITE_NAME} — Pay. Receive. Grow.`,
		description: SITE_DESCRIPTION,
		// twitter-image.tsx supplies the image.
	},
};

// Peakline is installable as a PWA — see the manifest linked above (with
// its own theme_color/background_color/icons) plus this, which is what
// actually colors the OS/browser chrome (status bar, task switcher) around
// the page itself.
//
// `interactiveWidget: "resizes-content"` (the CSS Viewport API's own
// keyword, not a Next-specific one) tells the OS to shrink the layout
// viewport when the on-screen keyboard opens instead of just overlaying it
// — the default a standalone/installed PWA (no browser chrome of its own
// to absorb the keyboard the way a normal browser tab does) is more likely
// to get wrong, which can show up as the keyboard being slow to appear or
// the focused input ending up hidden behind it. Reported live on the
// installed app specifically ("my keyboard is not coming out on time when
// i tap on inputs") — see `packages/ui`'s own `DialogContent` fix for the
// other half of this (a bottom-sheet drawer's auto-focus timing).
export const viewport: Viewport = {
	themeColor: "#066649",
	interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html data-scroll-behavior="smooth" lang="en" className={`${dmSans.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col">
				<ReactQueryProvider>
					<AuthProvider>
						{children}
						<Toaster />
					</AuthProvider>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
