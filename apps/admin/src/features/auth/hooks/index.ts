import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { axiosPublic } from "@/lib/config/axios";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { useAuthStore } from "@/lib/stores/authStore";
import { useLoginFlowStore } from "@/lib/stores/loginFlowStore";
import { decodeJwtPayload } from "@/lib/jwt";
import { toast } from "@repo/ui/sonner";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type {
	AdminSelfData,
	ApiSuccessResponse,
	AuthTokensData,
	LoginResponseData,
} from "@/lib/api/types";
import { isMfaRequired } from "@/lib/api/types";
import type { SignInValues, VerifyMfaValues } from "@/lib/validations/authValidations";

/**
 * The real access-control boundary for this whole app — a non-null
 * `accessToken` only ever means "this is *some* valid Peakline account",
 * not "this is staff" (nothing distinguishes the two at login time; see
 * `AuthState`'s own note). Decodes the fresh token's `sub` claim purely to
 * know which record to ask about, then leans entirely on the backend's own
 * admin-only guard: `GET /admin/users/{sub}` succeeding at all already
 * proves the caller is staff, and its `role`/`staffRole` fields are then
 * exactly what's needed for nav/action gating (e.g. Config and Staff
 * management are super_admin-only). A non-staff account gets a 403 here
 * exactly like it would on any other admin endpoint — that failure IS the
 * rejection, not a separate check bolted on afterwards.
 *
 * Called right after `setTokens` on every login, and again by
 * `AuthProvider` on every app load — same "don't trust a stale cookie
 * forever, reconcile against something real" pattern apps/web's own
 * `AuthProvider` uses for `customerType`.
 */
function useStaffGate() {
	const axiosAuth = useAxiosAuth();
	const setStaffVerified = useAuthStore((state) => state.setStaffVerified);
	const clear = useAuthStore((state) => state.clear);

	return async function verifyStaffAccess(): Promise<boolean> {
		const accessToken = useAuthStore.getState().accessToken;
		const payload = accessToken ? decodeJwtPayload(accessToken) : null;

		if (!payload?.sub) {
			clear();
			return false;
		}

		try {
			const { data } = await axiosAuth.get<ApiSuccessResponse<AdminSelfData>>(
				apiRoutes.users.byId(payload.sub),
			);
			if (data.data.role !== "staff" || !data.data.staffRole) {
				clear();
				return false;
			}
			setStaffVerified(data.data.staffRole);
			return true;
		} catch {
			clear();
			return false;
		}
	};
}

function useSignIn() {
	const router = useRouter();
	const setTokens = useAuthStore((state) => state.setTokens);
	const setPending = useLoginFlowStore((state) => state.setPending);
	const verifyStaffAccess = useStaffGate();

	return useMutation({
		mutationFn: async (values: SignInValues) => {
			const { data } = await axiosPublic.post<ApiSuccessResponse<LoginResponseData>>(
				apiRoutes.auth.LOGIN,
				values,
			);
			return { response: data, email: values.email };
		},
		onSuccess: async ({ response, email }) => {
			if (isMfaRequired(response.data)) {
				setPending(email, response.data.mfaToken);
				router.push("/login/verify");
				return;
			}

			setTokens(response.data, email);
			const isStaff = await verifyStaffAccess();
			if (!isStaff) {
				toast.error("This account doesn't have admin access");
				return;
			}
			router.push("/");
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Couldn't log you in"));
		},
	});
}

function useVerifyMfa() {
	const router = useRouter();
	const setTokens = useAuthStore((state) => state.setTokens);
	const mfaToken = useLoginFlowStore((state) => state.mfaToken);
	const email = useLoginFlowStore((state) => state.email);
	const resetLoginFlow = useLoginFlowStore((state) => state.reset);
	const verifyStaffAccess = useStaffGate();

	return useMutation({
		mutationFn: async (values: VerifyMfaValues) => {
			const { data } = await axiosPublic.post<ApiSuccessResponse<AuthTokensData>>(
				apiRoutes.auth.TWO_FA_VERIFY,
				{ mfaToken, totpCode: values.totpCode },
			);
			return data;
		},
		onSuccess: async (data) => {
			setTokens(data.data, email);
			resetLoginFlow();
			const isStaff = await verifyStaffAccess();
			if (!isStaff) {
				toast.error("This account doesn't have admin access");
				return;
			}
			router.push("/");
		},
		onError: (error) => {
			toast.error(getApiErrorMessage(error, "Invalid code"));
		},
	});
}

function useLogout() {
	const router = useRouter();
	const axiosAuth = useAxiosAuth();
	const clear = useAuthStore((state) => state.clear);
	const queryClient = useQueryClient();

	return async function logout() {
		try {
			await axiosAuth.post(apiRoutes.auth.LOGOUT);
		} catch (error) {
			// Best-effort — the session cookie is cleared client-side below
			// regardless, so a failed server-side revoke (network blip, an
			// already-expired token) shouldn't trap someone on the console.
			if (!isAxiosError(error)) throw error;
		}
		clear();
		queryClient.clear();
		router.push("/login");
	};
}

export { useStaffGate, useSignIn, useVerifyMfa, useLogout };
