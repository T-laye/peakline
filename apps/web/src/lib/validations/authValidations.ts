import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/min";

/**
 * Any country, not just Ghana — `PhoneInput` (@repo/ui) lets the user pick
 * any country's calling code, so validation has to actually know each
 * country's number format rather than assume Ghana's fixed 9-digit shape.
 * `isValidPhoneNumber` parses the "+<calling code> <digits>" string
 * `PhoneInput` hands back and validates it against that country's real
 * numbering rules.
 */
export const phoneSchema = z
	.string()
	.trim()
	.min(1, "Enter your phone number")
	.refine((value) => isValidPhoneNumber(value), "Enter a valid phone number");

export const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Enter your email address")
		.email("Enter a valid email address"),
	password: z.string().min(1, "Enter your password"),
});
export type SignInValues = z.infer<typeof signInSchema>;

/**
 * One rule per requirement (rather than one combined regex) so a live
 * checklist UI can point at exactly which ones are unmet — see
 * `PASSWORD_RULES` and its use in `SignUpForm`.
 */
export const PASSWORD_RULES = [
	{ key: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
	{ key: "lowercase", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
	{ key: "uppercase", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ key: "number", label: "One number", test: (v: string) => /[0-9]/.test(v) },
	{ key: "symbol", label: "One symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export const signUpSchema = z.object({
	firstName: z.string().trim().min(1, "Enter your first name"),
	lastName: z.string().trim().min(1, "Enter your last name"),
	otherName: z.string().trim().optional(),
	email: z
		.string()
		.trim()
		.min(1, "Enter your email address")
		.email("Enter a valid email address"),
	phone: phoneSchema,
	password: z
		.string()
		.min(1, "Enter a password")
		.refine(
			(value) => PASSWORD_RULES.every((rule) => rule.test(value)),
			"Your password doesn't meet all the requirements below",
		),
	agreeToTerms: z.boolean().refine((value) => value === true, {
		message: "You must agree to the Terms of Service and Privacy Policy",
	}),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Enter your email address")
		.email("Enter a valid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(1, "Enter a password")
			.refine(
				(value) => PASSWORD_RULES.every((rule) => rule.test(value)),
				"Your password doesn't meet all the requirements below",
			),
		confirmPassword: z.string().min(1, "Confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const accountTypeSchema = z.object({
	accountType: z.enum(["personal", "merchant"], {
		message: "Choose how you'll use Peakline",
	}),
});
export type AccountTypeValues = z.infer<typeof accountTypeSchema>;

/**
 * Business Information — the merchant-only middle step of onboarding
 * (Personal Information -> Business Information -> Review), reusing this
 * schema/name since the fields haven't changed, just where they're
 * collected (mid-flow now, not a standalone step right after Account Type).
 */
// `POST/PATCH /businesses`' own fixed category enum — a plain text field
// would let the backend reject anything that isn't one of these.
export const BUSINESS_CATEGORIES = [
	{ value: "retail", label: "Retail" },
	{ value: "food_beverage", label: "Food & Beverage" },
	{ value: "services", label: "Services" },
	{ value: "technology", label: "Technology" },
	{ value: "healthcare", label: "Healthcare" },
	{ value: "education", label: "Education" },
	{ value: "hospitality", label: "Hospitality" },
	{ value: "finance", label: "Finance" },
	{ value: "real_estate", label: "Real Estate" },
	{ value: "agriculture", label: "Agriculture" },
	{ value: "manufacturing", label: "Manufacturing" },
	{ value: "other", label: "Other" },
] as const;

// `businessCity`/`businessAddress` rather than `city`/`address` — this
// shape gets shallow-merged with `PersonalDetailsValues` on Review's submit
// (`{ ...personalDetails, ...businessInfo }`), which already owns `city`
// (the individual's own residential city); reusing that name here would
// silently clobber it. `country` is safe as-is — personal details has no
// field by that name (nationality is a separate concept, and stored as an
// ISO code, not this plain country name `POST /businesses` wants).
export const merchantSetupSchema = z.object({
	businessName: z.string().trim().min(1, "Enter your business name"),
	businessCategory: z.enum(
		BUSINESS_CATEGORIES.map((c) => c.value) as [string, ...string[]],
		{ message: "Select your business category" },
	),
	phone: phoneSchema,
	country: z.string().trim().min(1, "Select your business's country"),
	businessCity: z.string().trim().min(1, "Enter your business city"),
	businessAddress: z.string().trim().optional(),
});
export type MerchantSetupValues = z.infer<typeof merchantSetupSchema>;

export const verifyOtpSchema = z.object({
	code: z.string().length(6, "Enter the full 6-digit code"),
});
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

/**
 * Step 1 (Personal Information) of the post-verification onboarding flow —
 * Personal Information -> [Business Information, merchant only] -> Review.
 * No name field here — that's collected up front on Sign Up instead.
 */
export const personalDetailsSchema = z.object({
	dateOfBirth: z.string().min(1, "Enter your date of birth"),
	nationality: z.string().trim().min(1, "Select your nationality"),
	residentialAddress: z
		.string()
		.trim()
		.min(1, "Enter your residential address"),
	city: z.string().trim().min(1, "Enter your city"),
});
export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;

export const setPinSchema = z
	.object({
		pin: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN"),
		confirmPin: z.string().regex(/^\d{6}$/, "Re-enter your 6-digit PIN"),
	})
	.refine((data) => data.pin === data.confirmPin, {
		message: "PINs don't match",
		path: ["confirmPin"],
	});
export type SetPinValues = z.infer<typeof setPinSchema>;
