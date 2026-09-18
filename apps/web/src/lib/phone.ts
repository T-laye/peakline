import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/**
 * `PhoneInput` (@repo/ui) hands back one combined "+<calling code>
 * <national number>" string (e.g. "+233 241234567") regardless of which
 * country is selected. The backend instead wants those split apart: E.164
 * with no space (`phoneNumber: "+233241234567"`) plus a separate ISO
 * 3166-1 alpha-2 `countryCode` ("GH"). Returns `null` if the value can't be
 * parsed — `phoneSchema` (already run via zod before this is ever called)
 * should have rejected that already, so a `null` here would mean the two
 * have drifted out of sync.
 */
function splitPhoneForApi(
	phone: string,
): { phoneNumber: string; countryCode: string } | null {
	const parsed = parsePhoneNumberFromString(phone);
	if (!parsed || !parsed.country) return null;
	return { phoneNumber: parsed.number, countryCode: parsed.country };
}

/** `SendMoneyDto`'s phone shape is different from auth's own — it wants
 * local format with no country code (e.g. "241234567", not
 * "+233241234567"), so this can't reuse `splitPhoneForApi` above. */
function splitPhoneForTransfer(
	phone: string,
): { phoneNumber: string; countryCode: string } | null {
	const parsed = parsePhoneNumberFromString(phone);
	if (!parsed || !parsed.country) return null;
	return { phoneNumber: parsed.nationalNumber, countryCode: parsed.country };
}

/** `GET /wallets/search`'s own `countryCode` wants the numeric
 * international calling code (e.g. "233" for Ghana, per the endpoint's own
 * example "234") — NOT the ISO 3166-1 alpha-2 code `SendMoneyDto` and
 * `splitPhoneForTransfer` use ("GH"). Same field name, different
 * convention between the two endpoints — easy to conflate, so this stays
 * its own function rather than reusing that one, which would silently send
 * the wrong value here. */
function splitPhoneForSearch(
	phone: string,
): { phoneNumber: string; countryCode: string } | null {
	const parsed = parsePhoneNumberFromString(phone);
	if (!parsed || !parsed.countryCallingCode) return null;
	return { phoneNumber: parsed.nationalNumber, countryCode: parsed.countryCallingCode };
}

export { splitPhoneForApi, splitPhoneForTransfer, splitPhoneForSearch };
