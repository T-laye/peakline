import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	AdminLockUserPayload,
	AdminSetKycTierPayload,
	AdminSetRolePayload,
	AdminUser2faStatusData,
	AdminUserData,
	AdminUserSessionData,
	AdminUsersQuery,
	PaginatedResponse,
} from "@/lib/api/types";

const USERS_KEY = ["admin", "users"];
const SESSIONS_KEY = ["admin", "user-sessions"];
const TWO_FA_KEY = ["admin", "user-2fa"];

/** `GET /admin/users` — server-side filtered/paginated, confirmed live. */
function useAdminUsers(query: AdminUsersQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...USERS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminUserData>>(
				apiRoutes.users.BASE,
				{ params: { ...query, page, limit } },
			);
			return { users: data.data, meta: data.meta };
		},
	});
}

/** No shared cache entry with the list above — server-paginated, so a user
 * viewed here isn't guaranteed to be on whatever page the list last
 * fetched (same reasoning apps/web's own detail hooks use throughout). */
function useAdminUser(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...USERS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminUserData }>(
				apiRoutes.users.byId(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

/** Every moderation mutation below invalidates the whole `USERS_KEY`
 * prefix — cheap (a single user's queries, not the whole app) and correct
 * for both the list (status columns change) and the detail view (every
 * field the action touched) without hand-picking which fields each one
 * actually affects. */
function useInvalidateUsers() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: USERS_KEY });
}

function useLockUser(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateUsers();

	return useMutation({
		mutationFn: async (payload: AdminLockUserPayload) => {
			const { data } = await axiosAuth.patch<{ data: AdminUserData }>(
				apiRoutes.users.byIdLock(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** No request body — confirmed live. */
function useUnlockUser(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateUsers();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosAuth.patch<{ data: AdminUserData }>(
				apiRoutes.users.byIdUnlock(id),
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

function useSetKycTier(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateUsers();

	return useMutation({
		mutationFn: async (payload: AdminSetKycTierPayload) => {
			const { data } = await axiosAuth.patch<{ data: AdminUserData }>(
				apiRoutes.users.byIdKycTier(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Super_admin only per the backend's own guard — the UI hides this action
 * from other roles too (see `UserActions`), but the real enforcement is
 * server-side regardless. */
function useSetUserRole(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateUsers();

	return useMutation({
		mutationFn: async (payload: AdminSetRolePayload) => {
			const { data } = await axiosAuth.patch<{ data: AdminUserData }>(
				apiRoutes.users.byIdRole(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Cancels a pending self-service deletion request — doesn't delete
 * anything itself, the opposite: reverses the customer's own request. */
function useCancelDeletionRequest(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateUsers();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosAuth.delete<{ data: AdminUserData }>(
				apiRoutes.users.byIdDeletionRequest(id),
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Super_admin only, immediate and irreversible (per the endpoint's own
 * summary: "Immediately finalize account deletion") — `UserActions` gates
 * this behind its own extra confirmation on top of the shared dialog's
 * reason field. */
function useForceDeleteUser(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateUsers();

	return useMutation({
		mutationFn: async (payload: AdminLockUserPayload) => {
			await axiosAuth.post(apiRoutes.users.byIdForceDelete(id), payload);
		},
		onSuccess: invalidate,
	});
}

function useUserSessions(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...SESSIONS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminUserSessionData[] }>(
				apiRoutes.users.byIdSessions(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

function useRevokeUserSessions(id: string) {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await axiosAuth.delete(apiRoutes.users.byIdSessions(id));
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] }),
	});
}

function useUserTwoFaStatus(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...TWO_FA_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminUser2faStatusData }>(
				apiRoutes.users.byIdTwoFa(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

/** "Account recovery" per the endpoint's own summary — for a staff member
 * helping a user who's locked themselves out of their own authenticator. */
function useDisableUserTwoFa(id: string) {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: AdminLockUserPayload) => {
			await axiosAuth.delete(apiRoutes.users.byIdTwoFa(id), { data: payload });
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [...TWO_FA_KEY, id] }),
	});
}

export {
	useAdminUsers,
	useAdminUser,
	useLockUser,
	useUnlockUser,
	useSetKycTier,
	useSetUserRole,
	useCancelDeletionRequest,
	useForceDeleteUser,
	useUserSessions,
	useRevokeUserSessions,
	useUserTwoFaStatus,
	useDisableUserTwoFa,
};
