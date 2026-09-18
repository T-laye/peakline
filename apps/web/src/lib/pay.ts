/**
 * `GET /pay/{code}` takes just the code, but what a payer actually has in
 * hand is a shared link (`https://.../pay/<code>`) — the code is also
 * usable directly (e.g. typed in manually), so this accepts either and
 * returns just the code, same trailing-path-segment shape as
 * `PaymentLinkData`'s own `publicCode`/`url` pair.
 */
export function extractPaymentCode(input: string): string {
	const trimmed = input.trim();
	try {
		const url = new URL(trimmed);
		const segments = url.pathname.split("/").filter(Boolean);
		return segments[segments.length - 1] || trimmed;
	} catch {
		return trimmed;
	}
}
