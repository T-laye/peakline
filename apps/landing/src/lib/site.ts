/**
 * Absolute site URL, for `metadataBase` and anywhere else a fully-qualified
 * URL is needed (social meta tags, canonical links). Mirrors apps/web's own
 * lib/site.ts. This is what was missing here: without `metadataBase` set,
 * Next.js resolves the auto-generated opengraph-image/twitter-image URLs
 * against its own default base of `http://localhost:3000` — unreachable
 * from a deployed site, which is why sharing the live URL showed a broken
 * image instead of the real one. Prefers an explicit custom domain once one
 * exists; falls back to Vercel's stable production domain, then the current
 * deployment's own URL, then localhost for local dev. Vercel injects
 * `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` automatically — neither
 * needs setting by hand.
 */
const SITE_URL = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ??
		(process.env.VERCEL_PROJECT_PRODUCTION_URL &&
			`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ??
		(process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ??
		"http://localhost:3002",
);

export { SITE_URL };
