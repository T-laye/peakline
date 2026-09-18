/**
 * apps/landing is its own deployment (own domain/port), but auth still lives
 * in apps/web (see root CLAUDE.md) — every "Log in" / "Get Started" CTA here
 * has to cross apps, not route internally. `NEXT_PUBLIC_APP_URL` should be
 * set on the landing deployment to point at apps/web's real origin; without
 * it, this falls back to the actual deployed apps/web domain in production
 * (peakline-app.vercel.app, confirmed with the user) rather than localhost —
 * pointing a deployed site's CTAs at `localhost:3000` would just break them
 * for every real visitor. Local dev still defaults to localhost so nothing
 * extra is needed to run this app on its own machine.
 */
const PRODUCTION_APP_URL = "https://peakline-app.vercel.app";
const LOCAL_APP_URL = "http://localhost:3000";

const APP_URL =
	process.env.NEXT_PUBLIC_APP_URL ??
	(process.env.NODE_ENV === "production" ? PRODUCTION_APP_URL : LOCAL_APP_URL);

function appUrl(path: string): string {
	return `${APP_URL}${path}`;
}

export { appUrl };
