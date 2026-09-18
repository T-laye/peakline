"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "@repo/ui/sonner";
import { axiosPublic } from "@/lib/config/axios";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { splitPhoneForApi } from "@/lib/phone";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSignUpFlowStore } from "@/lib/stores/signUpFlowStore";
import { useLoginFlowStore } from "@/lib/stores/loginFlowStore";
import { useAccountSettingsStore } from "@/lib/stores/accountSettingsStore";
import type {
	ApiSuccessResponse,
	AuthTokensData,
	OtpSentData,
	CustomerType,
	ProfileData,
	StellarWalletData,
	MerchantOnboardingReviewData,
} from "@/lib/api/types";
import type {
	SignInValues,
	SignUpValues,
	AccountTypeValues,
	MerchantSetupValues,
	VerifyOtpValues,
	PersonalDetailsValues,
	SetPinValues,
	ForgotPasswordValues,
	ResetPasswordValues,
} from "@/lib/validations/authValidations";

// Still no backend counterpart for these steps — see the auth findings
// report. Keep using this until the backend grows the matching endpoint(s).
async function fakeRequest<T>(payload: T, delay = 800): Promise<T> {
	await new Promise((resolve) => setTimeout(resolve, delay));
	return payload;
}

/** `accountTypeSchema`'s values ("personal"/"merchant") predate the backend
 * integration and read better in the UI; `SetCustomerTypeDto` calls the
 * same first option "individual". Translate at the boundary rather than
 * renaming the schema and touching every screen that already says
 * "Individual"/"personal". */
const CUSTOMER_TYPE_MAP: Record<AccountTypeValues["accountType"], CustomerType> = {
	personal: "individual",
	merchant: "merchant",
};

/**
 * Every path that finishes a login — immediate (already has 2FA), or after
 * the 2FA setup prompt's skip/continue — funnels through here instead of a
 * raw `router.push("/")`. A real sign-up always creates a wallet before
 * ever reaching the dashboard (`useSetupWallet`, called from the sign-up
 * flow's own PIN step), but a returning account that dropped off
 * mid-onboarding — or exists some other way — could reach login with no
 * wallet yet; landing them on a dashboard where every balance/address is
 * empty looks like something's broken rather than like an unfinished
 * account, so this checks first and routes to the real PIN+wallet step
 * (reused as-is — it already tolerates being run again) instead.
 */
function useRouteAfterLogin() {
	const router = useRouter();
	const axiosAuth = useAxiosAuth();
	const setCustomerType = useAuthStore((state) => state.setCustomerType);

	return async function routeAfterLogin() {
		// The real, authoritative `customerType` — confirmed live against the
		// API that `/auth/login`'s own response never carries one
		// (AuthTokensDto is just the token pair), but `GET /users/me`
		// (ProfileDto) does. Fetched fresh on every login rather than trusted
		// from whatever's cached client-side, since that cache has already
		// drifted from reality once (a dev-only override forced every login
		// to cache "merchant" for a while) — a stale guess is worse than a
		// short wait for the real answer.
		try {
			const { data } = await axiosAuth.get<ApiSuccessResponse<ProfileData>>(
				apiRoutes.users.ME,
			);
			if (data.data.customerType) setCustomerType(data.data.customerType);
		} catch {
			// Non-fatal — falls back to whatever's already cached/cookied,
			// same as before this fetch existed.
		}

		try {
			await axiosAuth.get(apiRoutes.wallets.STELLAR);
			router.push("/");
		} catch (error) {
			if (isAxiosError(error) && error.response?.status === 404) {
				router.push("/auth/sign-up/set-pin");
				return;
			}
			// An unrelated failure (network, 500) shouldn't block an
			// otherwise-successful login — the dashboard's own "no wallet
			// yet" empty states are the fallback here, not a hard stop.
			router.push("/");
		}
	};
}

function useSignIn() {
	const setLoginEmail = useLoginFlowStore((state) => state.setEmail);
	const has2FA = useAccountSettingsStore((state) => state.has2FA);
	const setTokens = useAuthStore((state) => state.setTokens);
	const router = useRouter();
	const routeAfterLogin = useRouteAfterLogin();

	return useMutation({
		mutationFn: async (values: SignInValues) => {
			const { data } = await axiosPublic.post<
				ApiSuccessResponse<AuthTokensData>
			>(apiRoutes.auth.LOGIN, values);
			return data;
		},
		onSuccess: (data, values) => {
			setTokens(data.data, values.email);
			setLoginEmail(values.email);
			if (has2FA) {
				routeAfterLogin();
			} else {
				router.push("/auth/sign-in/two-factor-prompt");
			}
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Couldn't log you in"));
		},
	});
}

function useSignUp() {
	const router = useRouter();
	const setFirstName = useSignUpFlowStore((state) => state.setFirstName);
	const setLastName = useSignUpFlowStore((state) => state.setLastName);
	const setOtherName = useSignUpFlowStore((state) => state.setOtherName);
	const setEmail = useSignUpFlowStore((state) => state.setEmail);
	const setPhone = useSignUpFlowStore((state) => state.setPhone);
	const setOtpTtlSeconds = useSignUpFlowStore(
		(state) => state.setOtpTtlSeconds,
	);

	return useMutation({
		mutationFn: async (values: SignUpValues) => {
			const split = splitPhoneForApi(values.phone);
			if (!split) {
				// `phoneSchema` already validated this — reaching here means the
				// value and the validator disagreed, not a user mistake.
				throw new Error("Enter a valid phone number");
			}

			const { data } = await axiosPublic.post<
				ApiSuccessResponse<OtpSentData>
			>(apiRoutes.auth.REGISTER, {
				firstName: values.firstName,
				lastName: values.lastName,
				otherName: values.otherName || undefined,
				email: values.email,
				phoneNumber: split.phoneNumber,
				countryCode: split.countryCode,
				password: values.password,
			});
			return data;
		},
		onSuccess: (data, values) => {
			setFirstName(values.firstName);
			setLastName(values.lastName);
			setOtherName(values.otherName ?? "");
			setEmail(values.email);
			setPhone(values.phone);
			setOtpTtlSeconds(data.data.ttlSeconds);
			toast.success(data.message || "Account created — check your email for a code");
			router.push("/auth/sign-up/verify-otp");
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Couldn't create account"));
		},
	});
}

/** Real `/auth/resend-otp` for sign-up's email verification (`purpose:
 * "email_verification"`) — distinct from `useForgotPassword`'s resend,
 * which would use `purpose: "password_reset"` against a different (still
 * fake) flow. */
function useResendOtp() {
	return useMutation({
		mutationFn: async (email: string) => {
			const { data } = await axiosPublic.post<
				ApiSuccessResponse<OtpSentData>
			>(apiRoutes.auth.RESEND_OTP, { email, purpose: "email_verification" });
			return data;
		},
		onSuccess: () => toast.info("New code sent"),
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Couldn't resend code"));
		},
	});
}

/** Verifying the email is also, per the backend, the moment the account
 * actually logs in — the response carries real tokens, not just a
 * pass/fail, so this stores them before moving on. */
function useVerifyOtp() {
	const router = useRouter();
	const setTokens = useAuthStore((state) => state.setTokens);

	return useMutation({
		mutationFn: async (values: VerifyOtpValues & { email: string }) => {
			const { data } = await axiosPublic.post<
				ApiSuccessResponse<AuthTokensData>
			>(apiRoutes.auth.VERIFY_EMAIL, { email: values.email, otp: values.code });
			return data;
		},
		onSuccess: (data, values) => {
			setTokens(data.data, values.email);
			router.push("/auth/sign-up/account-type");
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Invalid code"));
		},
	});
}

/** Onboarding's account-type step — requires the access token
 * `useVerifyOtp` just stored (`PATCH /auth/customer-type`). */
function useSubmitAccountType() {
	const router = useRouter();
	const axiosAuth = useAxiosAuth();
	const setAccountType = useSignUpFlowStore((state) => state.setAccountType);
	const setStoredCustomerType = useAuthStore((state) => state.setCustomerType);

	return useMutation({
		mutationFn: async (values: AccountTypeValues) => {
			const { data } = await axiosAuth.patch<ApiSuccessResponse<null>>(
				apiRoutes.auth.CUSTOMER_TYPE,
				{ customerType: CUSTOMER_TYPE_MAP[values.accountType] },
			);
			return data;
		},
		onSuccess: (_data, values) => {
			setAccountType(values.accountType);
			setStoredCustomerType(CUSTOMER_TYPE_MAP[values.accountType]);
			// Both branches start at Personal Information now — Business
			// Information (merchant only) comes after it, not before.
			router.push("/auth/sign-up/personal-details");
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Couldn't save your choice"));
		},
	});
}

/**
 * Review's final submit. `businessName` is only ever present when
 * `usePersonalInfoFlowStore`'s `businessInfo` was non-null (i.e. the account
 * type is merchant, per that store's own typing), so its presence alone
 * decides which branch runs, without this hook needing its own
 * `accountType` param.
 *
 * Individual: `POST /onboarding/individual` alone.
 *
 * Merchant: `POST /onboarding/merchant` — a dedicated endpoint, not
 * `/onboarding/individual` (which also technically "serves" merchant per its
 * own docs, but only saves the personal-details half). This one atomically
 * sets `customerType=merchant`, saves those same personal fields, AND
 * registers the business in a single call, idempotent on
 * (ownerId, businessName) — safer than this hook's old approach (separate
 * `/onboarding/individual` then `POST /businesses` calls), which had no
 * idempotency of its own: retrying after the first call succeeded but the
 * second failed could register a duplicate business.
 *
 * `OnboardMerchantDto` has no `phone` field for the business (unlike
 * `CreateBusinessDto`, which does), and its own response is `data: null` —
 * no business id to act on straight away. So the merchant setup form's
 * `phone` is set with a follow-up `GET /onboarding/merchant` (to recover the
 * new business's id) + `PATCH /businesses/{id}`, best-effort: the account
 * and business are already fully created by the time this runs, so a
 * failure here (or skipping it, if `phone` wasn't filled in) shouldn't fail
 * sign-up over one field that can still be added later from Account
 * Settings' Business Information tab.
 */
function useCompleteSignUp() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (
			values: PersonalDetailsValues & Partial<MerchantSetupValues>,
		) => {
			if (!values.businessName) {
				const { data } = await axiosAuth.post<ApiSuccessResponse<null>>(
					apiRoutes.onboarding.INDIVIDUAL,
					{
						dateOfBirth: values.dateOfBirth,
						nationality: values.nationality,
						residentialAddress: values.residentialAddress,
						city: values.city,
					},
				);
				return data;
			}

			const { data } = await axiosAuth.post<ApiSuccessResponse<null>>(
				apiRoutes.onboarding.MERCHANT,
				{
					dateOfBirth: values.dateOfBirth,
					nationality: values.nationality,
					residentialAddress: values.residentialAddress,
					city: values.city,
					businessName: values.businessName,
					businessCategory: values.businessCategory,
					businessCountry: values.country,
					businessCity: values.businessCity,
					businessAddress: values.businessAddress || undefined,
				},
			);

			if (values.phone) {
				try {
					const { data: review } = await axiosAuth.get<
						ApiSuccessResponse<MerchantOnboardingReviewData>
					>(apiRoutes.onboarding.MERCHANT);
					if (review.data.business) {
						await axiosAuth.patch(
							apiRoutes.businesses.byId(review.data.business.id),
							{ phone: values.phone },
						);
					}
				} catch {
					// Best-effort — see this hook's own doc comment.
				}
			}

			return data;
		},
	});
}

/**
 * First-login step: setting the transaction PIN, then generating the
 * actual Stellar wallet right after — two real calls in sequence
 * (`POST /users/pin` then `POST /wallets/stellar`), matching the brief's
 * "PIN setup triggers wallet generation". Tolerates retrying this whole
 * step after a partial failure: if the PIN was already set on a prior
 * attempt (409 PIN_ALREADY_SET) or the wallet already exists (409
 * WALLET_ALREADY_EXISTS, in which case the existing one is fetched instead),
 * neither is treated as a hard error.
 *
 * `pinAlreadySet` surfaces that first case to the caller instead of staying
 * silent about it. Reported live: a completed sign-up (PIN set, wallet
 * created) later got routed back through this same screen — the
 * `useRouteAfterLogin` "no wallet yet" fallback re-triggers it whenever
 * `GET /wallets/stellar` 404s for any reason, not only genuine drop-off —
 * and `POST /users/pin` has no way to *check* whether a PIN already exists
 * ahead of time, only to attempt setting one. Without this flag, a user
 * retyping a *different* PIN on that second pass would see the same
 * "Wallet created" success and believe that new PIN is now theirs, when the
 * 409 actually left their original PIN untouched — a mismatch that would
 * only surface later, confusingly, the first time they tried to authorize
 * something.
 */
function useSetupWallet() {
	const axiosAuth = useAxiosAuth();
	const setWalletAddress = useAuthStore((state) => state.setWalletAddress);

	return useMutation({
		mutationFn: async (values: Pick<SetPinValues, "pin">) => {
			let pinAlreadySet = false;
			try {
				await axiosAuth.post(apiRoutes.users.PIN, { pin: values.pin });
			} catch (error) {
				if (!isAxiosError(error) || error.response?.status !== 409) throw error;
				pinAlreadySet = true;
			}

			try {
				const { data } = await axiosAuth.post<
					ApiSuccessResponse<StellarWalletData>
				>(apiRoutes.wallets.STELLAR);
				return { wallet: data.data, pinAlreadySet };
			} catch (error) {
				if (!isAxiosError(error) || error.response?.status !== 409) throw error;
				const { data } = await axiosAuth.get<
					ApiSuccessResponse<StellarWalletData>
				>(apiRoutes.wallets.STELLAR);
				return { wallet: data.data, pinAlreadySet };
			}
		},
		onSuccess: ({ wallet }) => {
			setWalletAddress(wallet.publicKey);
		},
	});
}

/**
 * Every login's final 2FA step — always an authenticator code now (email
 * isn't a separate method to choose; see `TwoFactorSetupPromptForm`).
 * Distinct from `useVerifyOtp` (Sign Up's email verification).
 *
 * Still fake — real login-time verification needs `POST /auth/2fa/verify`
 * (`{ mfaToken, totpCode }` → tokens), but `/auth/login`'s own documented
 * response is `AuthTokensDto` only, with no visible branch for "this
 * account has 2FA, here's an mfaToken instead of real tokens". Account
 * settings' enroll/confirm/disable are real (`features/profile/hooks`);
 * this half needs either backend confirmation of the actual login-time
 * shape or a live 2FA-enabled account to test against before it can be
 * wired for real.
 */
function useVerifyLogin() {
	return useMutation({
		mutationFn: (values: VerifyOtpValues & { email: string }) =>
			fakeRequest(values),
	});
}

// `resend-otp` (purpose: "password_reset") exists on the backend, but there's
// no endpoint yet to consume it + actually set a new password, and the
// current UI assumes an emailed link rather than the OTP code the backend
// sends — both stay fake until that gap closes. See the auth findings report.
function useForgotPassword() {
	return useMutation({
		mutationFn: (values: ForgotPasswordValues) => fakeRequest(values),
	});
}

function useResetPassword() {
	return useMutation({
		mutationFn: (values: ResetPasswordValues & { token: string | null }) =>
			fakeRequest(values),
	});
}

/**
 * Shared by the desktop Sidebar and the mobile Profile page (the two places
 * Logout lives — deliberately not in the primary bottom nav, see
 * `BottomTabBar`'s own note). Revokes the session server-side (best-effort —
 * a network failure here shouldn't trap the user mid-logout) and always
 * clears the local session + cached query data either way.
 */
function useLogout() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const axiosAuth = useAxiosAuth();

	return async function logout() {
		const { refreshToken, clear } = useAuthStore.getState();
		if (refreshToken) {
			try {
				await axiosAuth.post(apiRoutes.auth.LOGOUT, { refreshToken });
			} catch {
				// Best-effort — the local session is cleared below regardless, so
				// a still-valid server-side session (network blip, expired
				// access token that couldn't refresh) doesn't block sign-out.
			}
		}
		clear();
		queryClient.clear();
		toast.success("You've been logged out");
		router.push("/auth/sign-in");
	};
}

/** `POST /auth/logout-all` — revokes every refresh token on the account,
 * not just this device's. Access tokens already issued elsewhere stay
 * valid until they naturally expire (the docs say so explicitly), so this
 * clears the local session the same way `useLogout` does rather than
 * implying every other device is instantly signed out too. */
function useLogoutAll() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const axiosAuth = useAxiosAuth();

	return async function logoutAll() {
		const { clear } = useAuthStore.getState();
		try {
			await axiosAuth.post(apiRoutes.auth.LOGOUT_ALL);
		} catch (error) {
			toast.error(getApiErrorMessage(error, "Couldn't sign out of other devices"));
			return;
		}
		clear();
		queryClient.clear();
		toast.success("Signed out of every device");
		router.push("/auth/sign-in");
	};
}

export {
	useSignIn,
	useRouteAfterLogin,
	useSignUp,
	useSubmitAccountType,
	useResendOtp,
	useVerifyOtp,
	useCompleteSignUp,
	useSetupWallet,
	useVerifyLogin,
	useForgotPassword,
	useResetPassword,
	useLogout,
	useLogoutAll,
};
