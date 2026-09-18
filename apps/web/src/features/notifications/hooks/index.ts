import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { ApiSuccessResponse, NotificationData, PaginationMeta } from "@/lib/api/types";

const NOTIFICATIONS_KEY = ["notifications"];

/** The bell's own list — one page (the default `limit=20`), real as of
 * `GET /notifications`. Powers both the panel and the unread badge count
 * (see `useUnreadNotificationCount`); an account with more than 20 unread
 * notifications would undercount the badge until they clear some, same
 * "real data, simpler than a live feed" tradeoff `STREAM` not being wired
 * already takes. Polls every 30s rather than opening the real SSE stream —
 * a plain interval refetch needs no connection-lifecycle handling and reads
 * close enough to "live" for a notification bell. */
function useNotifications() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: NOTIFICATIONS_KEY,
		queryFn: async () => {
			const { data } = await axiosAuth.get<
				ApiSuccessResponse<NotificationData[]> & { meta: PaginationMeta }
			>(apiRoutes.notifications.LIST);
			return data.data;
		},
		refetchInterval: 30_000,
	});
}

/** Derived from `useNotifications`' own cached list rather than a second
 * request — `unreadOnly=true` would need its own query/cache entry just to
 * produce a number the full list already implies. */
function useUnreadNotificationCount() {
	const { data } = useNotifications();
	return data?.filter((n) => !n.readAt).length ?? 0;
}

function useMarkNotificationRead() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => axiosAuth.patch(apiRoutes.notifications.byIdRead(id)),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
	});
}

function useMarkAllNotificationsRead() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => axiosAuth.patch(apiRoutes.notifications.READ_ALL),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
	});
}

function useDeleteNotification() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => axiosAuth.delete(apiRoutes.notifications.byId(id)),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
	});
}

export {
	useNotifications,
	useUnreadNotificationCount,
	useMarkNotificationRead,
	useMarkAllNotificationsRead,
	useDeleteNotification,
};
