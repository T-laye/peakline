import { z } from "zod";

/**
 * `PATCH /users/me`'s own editable fields (`UpdateProfileFieldsDto`) —
 * email and phone number aren't in here at all; the API explicitly doesn't
 * accept changes to either through this endpoint ("those go through a
 * separate verified-change flow", not shipped yet), so `PersonalInformationTab`
 * shows them as permanently read-only rather than part of this form.
 *
 * `fullName` is one field here (matching the mock — there's no separate
 * First/Last/Other Name input anymore), split into `firstName`/`lastName`
 * at submit time (see `splitFullName`) since the real endpoint still wants
 * them separate; `otherName` simply isn't sent at all now rather than
 * cleared, since there's no field left to edit it from.
 */
export const profileSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username must be at most 30 characters")
		.regex(
			/^[a-z0-9_]+$/,
			"Lowercase letters, numbers, and underscores only",
		),
	fullName: z.string().trim().min(1, "Enter your full name"),
});
export type ProfileValues = z.infer<typeof profileSchema>;

/** First word is `firstName`, the rest is `lastName` — a plain-enough
 * heuristic for the common case, and the only one possible without a
 * separate field to ask the two apart explicitly. A single-word name
 * (rare, but real) puts everything in `firstName` and leaves `lastName`
 * empty rather than guessing further. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
	const parts = fullName.trim().split(/\s+/);
	return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}
