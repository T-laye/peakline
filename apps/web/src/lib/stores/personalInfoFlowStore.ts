import { create } from "zustand";
import type {
	PersonalDetailsValues,
	MerchantSetupValues,
} from "@/lib/validations/authValidations";

/**
 * Carries data across the post-verification onboarding sub-flow — Personal
 * Information -> [Business Information, merchant only] -> Review. Plain
 * in-memory store (not the session-persisted `signUpFlowStore`): this is a
 * short in-flight flow, not something that should survive a hard refresh.
 */
interface PersonalInfoFlowState {
	personalDetails: PersonalDetailsValues | null;
	setPersonalDetails: (values: PersonalDetailsValues) => void;
	/** Merchant accounts only — null the whole time for Individual. */
	businessInfo: MerchantSetupValues | null;
	setBusinessInfo: (values: MerchantSetupValues) => void;
	reset: () => void;
}

const usePersonalInfoFlowStore = create<PersonalInfoFlowState>()((set) => ({
	personalDetails: null,
	setPersonalDetails: (personalDetails) => set({ personalDetails }),
	businessInfo: null,
	setBusinessInfo: (businessInfo) => set({ businessInfo }),
	reset: () => set({ personalDetails: null, businessInfo: null }),
}));

export { usePersonalInfoFlowStore };
