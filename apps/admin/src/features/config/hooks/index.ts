import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { AdminConfigKeyData, AdminConfigValueData, AdminSetConfigPayload } from "@/lib/api/types";

const CONFIG_KEY = ["admin", "config"];

/** `GET /admin/config` — no `page`/`limit` params on the real spec, unlike
 * every paginated list elsewhere in this app; returns every key at once
 * (system config is expected to stay a short, hand-maintained list, not
 * grow like Users/Transactions). Never carries `value` — see
 * `AdminConfigKeyData`'s own note on why that's fetched separately, per key. */
function useAdminConfigKeys() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: CONFIG_KEY,
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminConfigKeyData[] }>(apiRoutes.config.BASE);
			return data.data;
		},
	});
}

/** `enabled` gates the actual fetch — a key's decrypted value is only ever
 * requested once an admin deliberately clicks "Reveal" on that row, never
 * prefetched for the whole list. */
function useAdminConfigValue(key: string, enabled: boolean) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...CONFIG_KEY, key],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminConfigValueData }>(
				apiRoutes.config.byKey(key),
			);
			return data.data;
		},
		enabled,
	});
}

/** Drops a revealed value's cache entry outright rather than just marking
 * it stale — "Hide" should mean the decrypted secret stops sitting in
 * memory, not just stops being displayed. */
function useForgetConfigValue() {
	const queryClient = useQueryClient();
	return (key: string) => queryClient.removeQueries({ queryKey: [...CONFIG_KEY, key] });
}

/** `PUT /admin/config/{key}` doubles as create-or-update per its own
 * summary — same mutation for both a brand-new key and an existing one. */
function useSetConfig() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ key, value }: { key: string } & AdminSetConfigPayload) => {
			const { data } = await axiosAuth.put<{ data: AdminConfigKeyData }>(
				apiRoutes.config.byKey(key),
				{ value },
			);
			return data.data;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_KEY }),
	});
}

function useDeleteConfig() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (key: string) => {
			await axiosAuth.delete(apiRoutes.config.byKey(key));
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_KEY }),
	});
}

export { useAdminConfigKeys, useAdminConfigValue, useForgetConfigValue, useSetConfig, useDeleteConfig };
