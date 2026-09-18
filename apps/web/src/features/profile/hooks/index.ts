import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { useAuthStore } from "@/lib/stores/authStore";
import type {
	AccountDeletionStatusData,
	ApiSuccessResponse,
	EnrollTotpData,
	PinChangeInitiatedData,
	ProfileData,
} from "@/lib/api/types";
import { splitFullName, type ProfileValues } from "@/lib/validations/profileValidations";
import type {
	ChangePasswordValues,
	ChangePinValues,
} from "@/lib/validations/accountSettingsValidations";
import type { PersonalDetailsValues } from "@/lib/validations/authValidations";

const PROFILE_KEY = ["profile", "me"];

/** `GET /users/me` — the real account record `PersonalInformationTab`
 * reads from (previously a hardcoded fake `DEFAULT_VALUES` object). Also
 * carries `deletionRequestedAt`/`deletionScheduledAt` for `AccountSettingsTab`'s
 * pending-deletion banner, and `customerType`/`kycTier`/verification
 * timestamps not used yet but worth having typed for whoever needs them
 * next. */
function useProfile(options?: { enabled?: boolean }) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: PROFILE_KEY,
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<ProfileData>>(
				apiRoutes.users.ME,
			);
			return data.data;
		},
		enabled: options?.enabled,
	});
}

/**
 * `POST /users/me/avatar` — `multipart/form-data`, field `file` (image/jpeg
 * or image/png, max 5MB, both enforced client-side too via
 * `AVATAR_MAX_BYTES`/`AVATAR_ACCEPTED_TYPES` before the request ever goes
 * out, matching the endpoint's own real limits rather than letting the
 * backend be the first to reject an oversized/wrong-type file). The
 * instance's own default `Content-Type: application/json` header would
 * break multipart parsing server-side if it stuck on this one request —
 * explicitly unset (not just left as `FormData`) so the browser sets its
 * own boundary-bearing header instead, the only way that boundary can be
 * generated correctly. Refetches the profile on success since the response
 * itself is `data: null` (see `apiRoutes.users.AVATAR`'s own note) — the
 * new `avatarUrl` only shows up once `GET /users/me` is re-fetched.
 */
function useUpdateAvatar() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			await axiosAuth.post(apiRoutes.users.AVATAR, formData, {
				headers: { "Content-Type": undefined },
			});
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
	});
}

/** `PATCH /users/me` — only firstName/lastName/username actually go out
 * (see `profileSchema`'s own note on why email/phone aren't here).
 * `fullName` is split back into firstName/lastName here (`splitFullName`);
 * `otherName` isn't sent at all — there's no field left to edit it from,
 * and the endpoint only changes fields actually included in the body, so
 * omitting it leaves whatever the account already had untouched. Refetches
 * the profile on success rather than trusting the (data: null) response
 * body to reflect the change. */
function useUpdateProfile() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (values: ProfileValues) => {
			const { firstName, lastName } = splitFullName(values.fullName);
			return axiosAuth.patch(apiRoutes.users.ME, {
				firstName,
				lastName,
				username: values.username,
			});
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
	});
}

/** Schedules the account for deletion 7 days out — not immediate, per the
 * endpoint's own description. `useCancelAccountDeletion` (`DELETE` on the
 * same path) reverses it any time within that window. Both update the
 * profile cache directly from their own response instead of refetching —
 * `AccountDeletionStatusDto` already has exactly the two fields that
 * changed. */
function useRequestAccountDeletion() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<AccountDeletionStatusData>>(
				apiRoutes.users.ME_DELETION_REQUEST,
			);
			return data.data;
		},
		onSuccess: (status) => {
			queryClient.setQueryData<ProfileData | undefined>(PROFILE_KEY, (profile) =>
				profile
					? {
							...profile,
							deletionRequestedAt: status.deletionRequestedAt,
							deletionScheduledAt: status.deletionScheduledAt,
						}
					: profile,
			);
		},
	});
}

function useCancelAccountDeletion() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosAuth.delete<ApiSuccessResponse<AccountDeletionStatusData>>(
				apiRoutes.users.ME_DELETION_REQUEST,
			);
			return data.data;
		},
		onSuccess: (status) => {
			queryClient.setQueryData<ProfileData | undefined>(PROFILE_KEY, (profile) =>
				profile
					? {
							...profile,
							deletionRequestedAt: status.deletionRequestedAt,
							deletionScheduledAt: status.deletionScheduledAt,
						}
					: profile,
			);
		},
	});
}

/** Begins TOTP enrollment — `POST /auth/2fa/enroll`. Returns the QR code
 * and recovery codes to show once; the account isn't actually protected
 * until `useConfirm2fa` succeeds with a code from that QR. Calling this
 * again while already enrolled 409s (`TOTP_ALREADY_ENROLLED`) — surfaced
 * as a normal mutation error, not swallowed, since re-enrolling silently
 * would invalidate a QR the user may have already scanned. */
function useEnroll2fa() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<EnrollTotpData>>(
				apiRoutes.twoFactor.ENROLL,
			);
			return data.data;
		},
	});
}

/** Activates 2FA with the first code from the authenticator app —
 * `POST /auth/2fa/confirm`. */
function useConfirm2fa() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (totpCode: string) => {
			await axiosAuth.post(apiRoutes.twoFactor.CONFIRM, { totpCode });
		},
	});
}

/** Disables 2FA — `DELETE /auth/2fa`, authorised by a current TOTP code
 * (not a password), matching the backend's own requirement. */
function useDisable2fa() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (totpCode: string) => {
			await axiosAuth.delete(apiRoutes.twoFactor.DISABLE, { data: { totpCode } });
		},
	});
}

/** Step 1 of Change Transaction PIN — `PATCH /users/pin`. Doesn't apply the
 * new PIN by itself; see `ChangePinDialog` for the confirmation step this
 * kicks off (`useConfirmChangePin`). */
function useChangePin() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (values: ChangePinValues) => {
			const { data } = await axiosAuth.patch<ApiSuccessResponse<PinChangeInitiatedData>>(
				apiRoutes.users.PIN,
				{ currentPin: values.oldPin, newPin: values.newPin },
			);
			return data.data;
		},
	});
}

/** Step 2 — `POST /users/pin/confirm` with the emailed OTP (or a TOTP code,
 * if `useChangePin`'s response said `requiresTwoFa`). Actually applies the
 * PIN change. */
function useConfirmChangePin() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (code: string) => {
			await axiosAuth.post(apiRoutes.users.PIN_CONFIRM, { code });
		},
	});
}

/**
 * Updates dateOfBirth/nationality/residentialAddress/city — reuses
 * `POST /onboarding/individual`, the *only* endpoint that accepts these
 * fields at all (confirmed live against `/docs-json`; there's no separate
 * "edit after onboarding" endpoint). Unverified whether the real backend
 * treats a second call as an update or rejects it as "already onboarded" —
 * worth confirming with the backend team; this is the only option either
 * way. Refetches the profile on success, same reasoning as
 * `useUpdateProfile`.
 */
function useUpdatePersonalDetails() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (values: PersonalDetailsValues) =>
			axiosAuth.post(apiRoutes.onboarding.INDIVIDUAL, values),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
	});
}

/**
 * `POST /auth/change-password` — real as of this writing (confirmed live).
 * Unlike Change PIN, this is one step (no OTP/2FA confirmation) but comes
 * with its own real consequence the mock's plain Old/New Password form
 * gives no hint of: "All existing sessions are revoked on success — the
 * user must log in again on all devices." That includes the very session
 * making this request, so a bare success toast would leave the UI looking
 * fine for a moment before the next authenticated call 401s out from under
 * it — instead this clears the local session and redirects to sign-in
 * immediately, same shape `useLogout` already uses.
 */
function useChangePassword() {
	const axiosAuth = useAxiosAuth();
	const router = useRouter();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (values: ChangePasswordValues) =>
			axiosAuth.post(apiRoutes.auth.CHANGE_PASSWORD, {
				currentPassword: values.oldPassword,
				newPassword: values.newPassword,
			}),
		onSuccess: () => {
			useAuthStore.getState().clear();
			queryClient.clear();
			router.push("/auth/sign-in");
		},
	});
}

export {
	useProfile,
	useUpdateProfile,
	useUpdateAvatar,
	useRequestAccountDeletion,
	useCancelAccountDeletion,
	useEnroll2fa,
	useConfirm2fa,
	useDisable2fa,
	useChangePin,
	useConfirmChangePin,
	useUpdatePersonalDetails,
	useChangePassword,
};
