import { z } from "zod";
import { BUSINESS_CATEGORIES } from "@/lib/validations/authValidations";

/**
 * `PATCH /businesses/{id}`'s own editable fields — a superset of what
 * onboarding's `merchantSetupSchema` collects (that form only asks for the
 * essentials at sign-up; this one, reached from Account settings, exposes
 * the rest: website/description/registrationNumber/taxId). Plain
 * `city`/`address` here (not `businessCity`/`businessAddress` like
 * `merchantSetupSchema`) — this form's values are never merged with
 * `PersonalDetailsValues`, so there's no name collision to avoid.
 *
 * Only `name`/`category`/`country` are required, matching
 * `CreateBusinessDto`'s own required set — everything else optional, same
 * as the backend. `phone` skips `phoneSchema`'s stricter libphonenumber
 * validation (that schema also requires a value) since a business phone is
 * optional here; `website` gets a light http(s):// check instead of full
 * URL parsing, mainly to catch "forgot the protocol" typos.
 */
export const updateBusinessSchema = z.object({
	name: z.string().trim().min(1, "Enter your business name"),
	category: z.enum(BUSINESS_CATEGORIES.map((c) => c.value) as [string, ...string[]], {
		message: "Select your business category",
	}),
	country: z.string().trim().min(1, "Select your business's country"),
	city: z.string().trim().optional(),
	address: z.string().trim().optional(),
	phone: z.string().trim().optional(),
	website: z
		.string()
		.trim()
		.optional()
		.refine((value) => !value || /^https?:\/\//.test(value), {
			message: "Enter a valid URL starting with http:// or https://",
		}),
	description: z.string().trim().max(500, "Description is too long").optional(),
	registrationNumber: z.string().trim().optional(),
	taxId: z.string().trim().optional(),
});
export type UpdateBusinessValues = z.infer<typeof updateBusinessSchema>;
