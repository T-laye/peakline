// Server-only — reads the non-`NEXT_PUBLIC_` env vars, so this must never
// be imported from a "use client" file or anything else that ends up in
// the browser bundle. `src/app/api/proxy/[...path]/route.ts` is the only
// thing that imports it.

export const API_BASE_URL =
	process.env.API_BASE_URL ??
	"https://peakline-backend-production.up.railway.app";

// The backend's `peakline-ref` header just identifies which client app is
// calling — a plain `apiKey`-type header per its OpenAPI spec, not an HMAC
// signature — so there's nothing to compute, just one value to attach.
// `APP_CLIENT_KEYS` holds one key per app in the monorepo; this picks the
// first as apps/web's own, verified live against `/health`.
const APP_CLIENT_KEY =
	process.env.APP_CLIENT_KEY ?? process.env.APP_CLIENT_KEYS?.split(",")[0] ?? "";

export function buildProxyHeaders() {
	return { "peakline-ref": APP_CLIENT_KEY };
}
