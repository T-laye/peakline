import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	ApiSuccessResponse,
	PaginationMeta,
	TransactionData,
	TransactionDirection,
	TransactionLedgerStatus,
	TransactionType,
} from "@/lib/api/types";

const TRANSACTIONS_KEY = ["transactions"];

export interface TransactionsQuery {
	q?: string;
	type?: TransactionType;
	status?: TransactionLedgerStatus;
	currency?: string;
	direction?: TransactionDirection;
	from?: string;
	to?: string;
	order?: "asc" | "desc";
}

/**
 * `GET /transactions` — server-side filtered/paginated, and already scoped
 * server-side by account type (an individual's own personal history vs. a
 * merchant's consolidated feed across their personal wallet + every
 * business they own). One hook for both `/transactions` (no `direction`)
 * and `/payments` (merchant-only, `direction: "incoming"` baked into the
 * query the caller passes) — the endpoint's own filters already draw that
 * line, so there's no need for two separate hooks.
 *
 * `staleTime: 0` + a 30s `refetchInterval` — this backs the merchant
 * Overview's own "Recent Payments" alongside the full Transactions/Payments
 * history pages, and a transaction landing here can originate entirely
 * outside this app (a customer paying with their own wallet), so there's no
 * in-app mutation to invalidate this cache on success. Reported live as
 * stale figures on the merchant Overview specifically ("along side other
 * affected stats") — this is one of those other stats. Same 30s cadence
 * `useNotifications` already polls at.
 */
function useTransactions(query: TransactionsQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...TRANSACTIONS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<
				ApiSuccessResponse<TransactionData[]> & { meta: PaginationMeta }
			>(apiRoutes.transactions.LIST, { params: { ...query, page, limit } });
			return { transactions: data.data, meta: data.meta };
		},
		staleTime: 0,
		refetchInterval: 30_000,
	});
}

/** No dedicated cache entry shared with the list above — the list is
 * server-paginated, so a transaction viewed on the detail page isn't
 * guaranteed to be on whatever page the list last fetched (same reasoning
 * as Payment Links' own `useMerchantPaymentLink`). */
function useTransaction(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...TRANSACTIONS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<TransactionData>>(
				apiRoutes.transactions.byId(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

/** Blob download, same pattern as Payment Links' own CSV export — a plain
 * `<a href>` wouldn't carry the `Authorization` header the proxy's
 * interceptor attaches. Runs the same filters as the list view. */
function useExportTransactionsCsv() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (query: TransactionsQuery) => {
			const response = await axiosAuth.get<Blob>(apiRoutes.transactions.EXPORT_CSV, {
				params: query,
				responseType: "blob",
			});
			const url = URL.createObjectURL(response.data);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	});
}

export { useTransactions, useTransaction, useExportTransactionsCsv };
