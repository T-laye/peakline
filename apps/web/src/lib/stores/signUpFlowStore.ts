import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AccountTypeValues } from "@/lib/validations/authValidations";

/**
 * Transient state carried across the multi-step sign-up flow (Sign Up ->
 * Verify -> Account Type -> Personal Details -> [Business Information,
 * merchant only] -> Review -> Wallet Created). Session-scoped (not
 * localStorage) — this shouldn't outlive the browser tab, and shouldn't
 * leak into a URL either.
 */
interface SignUpFlowState {
	firstName: string;
	setFirstName: (firstName: string) => void;
	lastName: string;
	setLastName: (lastName: string) => void;
	/** Optional — a middle name/alias, not every account has one. */
	otherName: string;
	setOtherName: (otherName: string) => void;
	/** Set at Sign Up — Verify checks the code against this. */
	email: string;
	setEmail: (email: string) => void;
	phone: string;
	setPhone: (phone: string) => void;
	/** `OtpSentDto.ttlSeconds` from `/auth/register`'s response — seeds
	 * Verify's real resend countdown instead of a hardcoded guess. */
	otpTtlSeconds: number;
	setOtpTtlSeconds: (otpTtlSeconds: number) => void;
	/** Personal vs Merchant, chosen on the Account Type step — decides which
	 * merchant-only routes/nav this same `apps/web` account unlocks (there's
	 * no separate merchant app to land in; see CLAUDE.md's Monorepo layout).
	 * Unset until that step completes. */
	accountType: AccountTypeValues["accountType"] | null;
	setAccountType: (accountType: AccountTypeValues["accountType"]) => void;
	reset: () => void;
}

const useSignUpFlowStore = create<SignUpFlowState>()(
	persist(
		(set) => ({
			firstName: "",
			setFirstName: (firstName) => set({ firstName }),
			lastName: "",
			setLastName: (lastName) => set({ lastName }),
			otherName: "",
			setOtherName: (otherName) => set({ otherName }),
			email: "",
			setEmail: (email) => set({ email }),
			phone: "",
			setPhone: (phone) => set({ phone }),
			otpTtlSeconds: 45,
			setOtpTtlSeconds: (otpTtlSeconds) => set({ otpTtlSeconds }),
			accountType: null,
			setAccountType: (accountType) => set({ accountType }),
			reset: () =>
				set({
					firstName: "",
					lastName: "",
					otherName: "",
					email: "",
					phone: "",
					otpTtlSeconds: 45,
					accountType: null,
				}),
		}),
		{
			name: "peakline-sign-up-flow",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export { useSignUpFlowStore };
