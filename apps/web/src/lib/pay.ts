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

/** `abcd1234…wxyz` — long hashes/addresses in tight rows, where the full
 * value is still one tap away via a copy button. */
export function truncateMiddle(value: string, head = 6, tail = 6): string {
	if (value.length <= head + tail + 1) return value;
	return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
