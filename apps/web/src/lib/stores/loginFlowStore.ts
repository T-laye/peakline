import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Authenticator app is the only 2FA method this backend supports — email
// isn't a separate method to pick, since the login step itself already is
// one. Kept as a single-value union (not just dropped) so `VerifyCodeForm`'s
// shared `method` prop stays the same shape Sign Up's email verification
// also uses ("email" | "authenticator" there).
export type TwoFactorMethod = "authenticator";

/**
 * Carries state across the Sign In -> Verify sequence for an account
 * turning 2FA on right after logging in (see `TwoFactorSetupPromptForm`).
 * Session-persisted like `signUpFlowStore` (same rationale: survives a
 * refresh mid-flow, gone once the tab closes).
 */
interface LoginFlowState {
	email: string;
	setEmail: (email: string) => void;
	twoFactorMethod: TwoFactorMethod | null;
	setTwoFactorMethod: (method: TwoFactorMethod) => void;
	reset: () => void;
}

const useLoginFlowStore = create<LoginFlowState>()(
	persist(
		(set) => ({
			email: "",
			setEmail: (email) => set({ email }),
			twoFactorMethod: null,
			setTwoFactorMethod: (twoFactorMethod) => set({ twoFactorMethod }),
			reset: () => set({ email: "", twoFactorMethod: null }),
		}),
		{
			name: "peakline-login-flow",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export { useLoginFlowStore };
