import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/**
 * `PhoneInput` (@repo/ui) hands back one combined "+<calling code>
 * <national number>" string (e.g. "+233 241234567") regardless of which
 * country is selected. `AdminInviteStaffDto` wants those split apart —
 * assumed E.164 with no space (`phoneNumber: "+233241234567"`) plus a
 * separate ISO 3166-1 alpha-2 `countryCode` ("GH"), matching its closest
 * confirmed sibling (`RegisterDto`, the customer sign-up) since the invite
 * DTO's own two fields carry no example/description of their own — see
 * `AdminInviteStaffPayload`'s own note. Ported from apps/web's identical
 * `splitPhoneForApi` rather than shared (no cross-app import). Returns
 * `null` if the value can't be parsed — `phoneSchema` (run via zod before
 * this is ever called) should have rejected that already.
 */
function splitPhoneForApi(phone: string): { phoneNumber: string; countryCode: string } | null {
	const parsed = parsePhoneNumberFromString(phone);
	if (!parsed || !parsed.country) return null;
	return { phoneNumber: parsed.number, countryCode: parsed.country };
}

export { splitPhoneForApi };
