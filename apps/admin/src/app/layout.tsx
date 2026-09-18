import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@repo/ui/sonner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
});

// Internal-only — no SEO/social-card metadata needed (unlike apps/web's own
// layout), and deliberately not indexable if it ever ends up publicly
// reachable at an admin.* subdomain.
export const metadata: Metadata = {
	title: "Peakline Admin",
	description: "Internal operations console for the Peakline platform.",
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${dmSans.variable} h-full antialiased`}>
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
