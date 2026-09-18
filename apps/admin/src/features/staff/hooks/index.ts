import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	AdminChangeStaffRolePayload,
	AdminInviteStaffPayload,
	AdminInviteStaffResponseData,
	AdminStaffQuery,
	AdminUserData,
	PaginatedResponse,
} from "@/lib/api/types";

const STAFF_KEY = ["admin", "staff"];

/** `GET /admin/staff` — no free-text `q` (unlike Users), only the
 * `staffRole` filter — see `AdminStaffQuery`'s own note. */
function useAdminStaff(query: AdminStaffQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...STAFF_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminUserData>>(
				apiRoutes.staff.BASE,
				{ params: { ...query, page, limit } },
			);
			return { staff: data.data, meta: data.meta };
		},
	});
}

function useInvalidateStaff() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: STAFF_KEY });
}

function useInviteStaff() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateStaff();

	return useMutation({
		mutationFn: async (payload: AdminInviteStaffPayload) => {
			const { data } = await axiosAuth.post<{ data: AdminInviteStaffResponseData }>(
				apiRoutes.staff.INVITE,
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Bound to no particular id at hook-call time (unlike e.g.
 * `useDeactivateWallet(id)`) — Staff has no per-row detail page to own a
 * single id the way Wallets/Businesses do, so both this and
 * `useDeactivateStaff` below take the target id at `mutate()` time instead,
 * from whichever row's dialog is currently open. */
function useChangeStaffRole() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateStaff();

	return useMutation({
		mutationFn: async ({
			id,
			staffRole,
		}: { id: string } & AdminChangeStaffRolePayload) => {
			const { data } = await axiosAuth.patch<{ data: AdminUserData }>(
				apiRoutes.staff.byIdRole(id),
				{ staffRole },
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** No request body, no response worth typing (`data: null` per the real
 * spec) — same shape as wallet reactivate's own "hidden" reason mode. */
function useDeactivateStaff() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateStaff();

	return useMutation({
		mutationFn: async (id: string) => {
			await axiosAuth.delete(apiRoutes.staff.byId(id));
		},
		onSuccess: invalidate,
	});
}

export { useAdminStaff, useInviteStaff, useChangeStaffRole, useDeactivateStaff };
