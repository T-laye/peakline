import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@repo/ui/sonner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
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
	},
};

export const viewport: Viewport = {
	themeColor: "#066649",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			data-scroll-behavior="smooth"
			lang="en"
			className={`${dmSans.variable} h-full overflow-x-hidden antialiased`}
		>
			{/* overflow-x-hidden here too, not just on <main> (LandingPage.tsx):
			 * Navbar is `position: fixed` (Hero.tsx) so it's positioned against
			 * the viewport directly, escaping <main>'s own overflow clipping
			 * entirely — only the root scrolling element can contain a fixed
			 * descendant that overflows horizontally. */}
			<body className="min-h-full flex flex-col overflow-x-hidden">
				<ReactQueryProvider>
					{children}
					<Toaster />
				</ReactQueryProvider>
			</body>
		</html>
	);
}
