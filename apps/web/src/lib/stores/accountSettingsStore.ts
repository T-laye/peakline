import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Durable account-level settings — unlike the sign-up/login flow stores
 * (session-scoped, meant to disappear once their flow finishes), this is a
 * standing preference that should survive across logins and browser
 * sessions, so it's localStorage-persisted rather than sessionStorage.
 *
 * `has2FA` stands in for a real backend record of whether the account has
 * 2-factor authentication enabled — there's no real backend, so a login's
 * "auth response" checking this is, in practice, checking this persisted
 * flag instead.
 */
interface AccountSettingsState {
	has2FA: boolean;
	setHas2FA: (has2FA: boolean) => void;
}

const useAccountSettingsStore = create<AccountSettingsState>()(
	persist(
		(set) => ({
			has2FA: false,
			setHas2FA: (has2FA) => set({ has2FA }),
		}),
		{
			name: "peakline-account-settings",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export { useAccountSettingsStore };
