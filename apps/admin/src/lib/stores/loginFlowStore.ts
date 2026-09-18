import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Carries state across the Login -> Verify MFA sequence. Session-persisted
 * (survives a refresh mid-flow, gone once the tab closes) — same rationale
 * as apps/web's own `loginFlowStore`.
 */
interface LoginFlowState {
	email: string;
	mfaToken: string;
	setPending: (email: string, mfaToken: string) => void;
	reset: () => void;
}

const useLoginFlowStore = create<LoginFlowState>()(
	persist(
		(set) => ({
			email: "",
			mfaToken: "",
			setPending: (email, mfaToken) => set({ email, mfaToken }),
			reset: () => set({ email: "", mfaToken: "" }),
		}),
		{
			name: "peakline-admin-login-flow",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export { useLoginFlowStore };
