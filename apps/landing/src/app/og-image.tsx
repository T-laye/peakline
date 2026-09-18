import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";

/** Node's native `fetch` doesn't support `file://` URLs (only the edge
 * runtime's polyfilled one does), so local assets are read straight off
 * disk instead of via `fetch(new URL(..., import.meta.url))`. Mirrors
 * apps/web/src/app/og-image.tsx verbatim — apps/landing had no OG image at
 * all until now (nothing to swap in, so no earlier "blurry" version; a
 * missing image is what a lot of clients render as one instead). */
function loadLocalFile(relativePath: string) {
	return readFile(fileURLToPath(new URL(relativePath, import.meta.url)));
}

// Brand colors, from packages/ui/src/styles/globals.css's primary/secondary
// ramps — duplicated here since ImageResponse (Satori) can't read our
// Tailwind tokens, only literal values.
const PRIMARY_900 = "#02261b";
const PRIMARY_700 = "#054c37";
const PRIMARY_400 = "#39997c";
const SECONDARY_500 = "#fcd116";

/**
 * Shared by opengraph-image.tsx and twitter-image.tsx — Next.js requires
 * each special file's `runtime`/`size`/`contentType`/`alt` exports to be
 * literal and declared directly in that file (not re-exported), so only the
 * actual rendering logic is factored out here.
 */
async function renderOgImage() {
	const [regularFont, boldFont, iconBuffer] = await Promise.all([
		loadLocalFile("./og-fonts/DMSans-Regular.ttf"),
		loadLocalFile("./og-fonts/DMSans-Bold.ttf"),
		loadLocalFile("../../public/favicon/android-chrome-192x192.png"),
	]);
	const iconSrc = `data:image/png;base64,${iconBuffer.toString("base64")}`;

	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					padding: "80px",
					position: "relative",
					fontFamily: "DM Sans",
					background: `linear-gradient(135deg, ${PRIMARY_900} 0%, ${PRIMARY_700} 65%, ${PRIMARY_400} 100%)`,
				}}
			>
				<div
					style={{
						display: "flex",
						position: "absolute",
						top: -120,
						right: -120,
						width: 420,
						height: 420,
						borderRadius: 420,
						background: "rgba(255,255,255,0.06)",
					}}
				/>
				<div
					style={{
						display: "flex",
						position: "absolute",
						bottom: -150,
						right: 200,
						width: 260,
						height: 260,
						borderRadius: 260,
						background: "rgba(252,209,22,0.10)",
					}}
				/>

				<div style={{ display: "flex", alignItems: "center", gap: 22 }}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={iconSrc}
						width={84}
						height={84}
						style={{ borderRadius: 18 }}
						alt=""
					/>
					<span style={{ fontSize: 58, fontWeight: 700, color: "#ffffff" }}>
						peakline
					</span>
				</div>

				<div
					style={{
						display: "flex",
						marginTop: 40,
						fontSize: 32,
						fontWeight: 700,
						color: SECONDARY_500,
					}}
				>
					Pay. Receive. Grow.
				</div>

				<div
					style={{
						display: "flex",
						marginTop: 18,
						maxWidth: 760,
						fontSize: 27,
						fontWeight: 400,
						lineHeight: 1.4,
						color: "rgba(255,255,255,0.85)",
					}}
				>
					A simple, secure digital wallet for Ghana — send, receive and pay
					with USDC on Stellar.
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{ name: "DM Sans", data: regularFont, weight: 400, style: "normal" },
				{ name: "DM Sans", data: boldFont, weight: 700, style: "normal" },
			],
		},
	);
}

export { renderOgImage };
