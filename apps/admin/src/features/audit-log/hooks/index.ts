import { useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { AdminAuditLogEntryData, AdminAuditLogQuery, PaginatedResponse } from "@/lib/api/types";

const AUDIT_LOG_KEY = ["admin", "audit-log"];

function useAdminAuditLog(query: AdminAuditLogQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...AUDIT_LOG_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminAuditLogEntryData>>(
				apiRoutes.auditLog.BASE,
				{ params: { ...query, page, limit } },
			);
			return { entries: data.data, meta: data.meta };
		},
	});
}

/** Same undocumented-response caveat as `useAdminTransaction` — see
 * `AdminAuditLogEntryData`'s own note. */
function useAdminAuditLogEntry(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...AUDIT_LOG_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(apiRoutes.auditLog.byId(id));
			return data.data as AdminAuditLogEntryData;
		},
		enabled: !!id,
	});
}

export { useAdminAuditLog, useAdminAuditLogEntry };
