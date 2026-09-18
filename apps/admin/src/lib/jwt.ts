/**
 * Decodes a JWT's payload without verifying its signature — never use this
 * to make a trust decision on its own. The one place this app uses it
 * (`useStaffGate`) only pulls the `sub` claim to know *which* admin-only
 * record to fetch (`GET /admin/users/{sub}`); the backend's own auth guard
 * on that endpoint is what actually enforces anything. A forged or expired
 * token would just fail that request instead.
 */
export function decodeJwtPayload(token: string): { sub?: string; email?: string } | null {
	try {
		const [, payload] = token.split(".");
		if (!payload) return null;
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
				.join(""),
		);
		return JSON.parse(json);
	} catch {
		return null;
	}
}
