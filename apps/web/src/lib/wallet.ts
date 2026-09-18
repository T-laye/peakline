/**
 * Fake, fixed Stellar-shaped public key — no real Stellar account exists
 * behind it yet. Fixed rather than randomly generated per-mount, so it
 * stays the same everywhere it's shown (the wallet-created page, the
 * Wallet page, anywhere else later) — a real address obviously wouldn't
 * change on every render.
 */
export const FAKE_WALLET_ADDRESS =
	"GJOKMMTKAEJKOAZ74AXYNDRRZGGE7LAODIYST3DQ7CRB4ATDNEHV4ITK";

export function maskWalletAddress(address: string) {
	return `${address.slice(0, 5)}${"*".repeat(8)}${address.slice(-5)}`;
}

/** Canonical Stellar public-key shape — "G" + 55 base32 chars, 56 total.
 * Single source of truth for both validating a manually-typed address
 * (`sendValidations`) and recognizing one decoded from a QR/link
 * (`parseSendLink` below), so the two can't drift apart. */
export const WALLET_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

/**
 * "Receive via QR/link" for both individual and merchant accounts, backed
 * by the real `GET /wallets/lookup/{userId}` (confirmed live — resolves any
 * user id to a display name + wallet address; see `WalletLookupData`'s own
 * note). The QR/link both just carry the account's own user id, wrapped in
 * a same-origin URL that opens straight into `/pay` — reported live: this
 * belongs in the Pay section, not a detour through the general-purpose
 * Send flow. `PayPage` resolves it into a name + address and shows its own
 * `PersonPaymentCard` (avatar, resolved name, payer-entered amount, Pay
 * button), and paying is the exact same `POST /transfers/send`
 * (`mode: "wallet"`) flow as pasting an address in manually.
 * `window.location.origin` rather than a hardcoded domain so this keeps
 * working across dev/staging/production without an env var to keep in
 * sync.
 */
export function buildReceiveLink(userId: string) {
	if (typeof window === "undefined") return "";
	const url = new URL("/pay", window.location.origin);
	url.searchParams.set("userId", userId);
	return url.toString();
}

/**
 * The other direction — given whatever text a QR scan or a pasted link
 * produced, recognizes one of this app's own `buildReceiveLink` URLs and
 * returns just the user id. Returns `null` for anything else (a bare
 * wallet address — handled separately, see `WALLET_ADDRESS_REGEX` — a
 * merchant Payment Link's own code/URL, garbage input, etc.) so the caller
 * can fall back to its existing handling for that case instead of assuming
 * every scan is a receive link.
 */
export function parseReceiveLink(input: string): string | null {
	try {
		const url = new URL(input.trim());
		return url.searchParams.get("userId");
	} catch {
		return null;
	}
}
