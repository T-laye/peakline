import type { AccountTypeValues } from "@/lib/validations/authValidations";

/**
 * The post-verification onboarding stepper's steps and length depend on
 * account type — Individual skips Business Information entirely, so it's a
 * 2-step flow instead of 3. Shared by Personal Details, Business
 * Information, and Review so the three steps' stepper labels can't drift
 * out of sync with each other.
 */
const INDIVIDUAL_STEPS = ["Personal Information", "Review"];
const MERCHANT_STEPS = ["Personal Information", "Business Information", "Review"];

function getOnboardingSteps(accountType: AccountTypeValues["accountType"] | null) {
	return accountType === "merchant" ? MERCHANT_STEPS : INDIVIDUAL_STEPS;
}

export { getOnboardingSteps };
