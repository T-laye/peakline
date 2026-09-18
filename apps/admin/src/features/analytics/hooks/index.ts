import { useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { AdminOverviewData, ApiSuccessResponse } from "@/lib/api/types";

const OVERVIEW_KEY = ["admin", "analytics", "overview"];

/** Platform-wide totals for the dashboard home — the same call
 * `useStaffGate` could have used to confirm access, but that one now reads
 * `GET /admin/users/{id}` instead since it also needs `staffRole`; this one
 * is purely the Overview screen's own data. */
function useAdminOverview() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: OVERVIEW_KEY,
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<AdminOverviewData>>(
				apiRoutes.analytics.OVERVIEW,
			);
			return data.data;
		},
	});
}

export { useAdminOverview };
