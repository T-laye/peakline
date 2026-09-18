import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	AdminBusinessData,
	AdminBusinessesQuery,
	AdminBusinessPaymentLinkData,
	AdminBusinessWalletData,
	BusinessStatusEventData,
	PaginatedResponse,
} from "@/lib/api/types";

const BUSINESSES_KEY = ["admin", "businesses"];
const STATUS_HISTORY_KEY = ["admin", "business-status-history"];
const WALLETS_KEY = ["admin", "business-wallets"];
const PAYMENT_LINKS_KEY = ["admin", "business-payment-links"];

function useAdminBusinesses(query: AdminBusinessesQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...BUSINESSES_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminBusinessData>>(
				apiRoutes.businesses.BASE,
				{ params: { ...query, page, limit } },
			);
			return { businesses: data.data, meta: data.meta };
		},
	});
}

function useAdminBusiness(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...BUSINESSES_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminBusinessData }>(
				apiRoutes.businesses.byId(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

function useInvalidateBusinesses() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: BUSINESSES_KEY });
}

function useVerifyBusiness(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateBusinesses();

	return useMutation({
		mutationFn: async (payload: { reason?: string }) => {
			const { data } = await axiosAuth.post<{ data: AdminBusinessData }>(
				apiRoutes.businesses.byIdVerify(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

function useSuspendBusiness(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateBusinesses();

	return useMutation({
		mutationFn: async (payload: { reason: string }) => {
			const { data } = await axiosAuth.post<{ data: AdminBusinessData }>(
				apiRoutes.businesses.byIdSuspend(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

function useReactivateBusiness(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateBusinesses();

	return useMutation({
		mutationFn: async (payload: { reason?: string }) => {
			const { data } = await axiosAuth.post<{ data: AdminBusinessData }>(
				apiRoutes.businesses.byIdReactivate(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

function useBusinessStatusHistory(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...STATUS_HISTORY_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: BusinessStatusEventData[] }>(
				apiRoutes.businesses.byIdStatusHistory(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

/** Real response schema is undocumented (see `AdminBusinessWalletData`'s
 * own note) — typed defensively. */
function useBusinessWallets(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...WALLETS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(apiRoutes.businesses.byIdWallets(id));
			return (data.data as AdminBusinessWalletData[] | null) ?? [];
		},
		enabled: !!id,
	});
}

/** Same undocumented-response caveat as wallets above — see
 * `AdminBusinessPaymentLinkData`'s own note. */
function useBusinessPaymentLinks(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_LINKS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(
				apiRoutes.businesses.byIdPaymentLinks(id),
			);
			return (data.data as AdminBusinessPaymentLinkData[] | null) ?? [];
		},
		enabled: !!id,
	});
}

export {
	useAdminBusinesses,
	useAdminBusiness,
	useVerifyBusiness,
	useSuspendBusiness,
	useReactivateBusiness,
	useBusinessStatusHistory,
	useBusinessWallets,
	useBusinessPaymentLinks,
};
