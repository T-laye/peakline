import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	AdminReasonOptionalPayload,
	AdminTransactionData,
	AdminTransactionsQuery,
	PaginatedResponse,
	UnknownRecord,
} from "@/lib/api/types";

const TRANSACTIONS_KEY = ["admin", "transactions"];
const LEDGER_ENTRIES_KEY = ["admin", "transaction-ledger-entries"];

function useAdminTransactions(query: AdminTransactionsQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...TRANSACTIONS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminTransactionData>>(
				apiRoutes.transactions.BASE,
				{ params: { ...query, page, limit } },
			);
			return { transactions: data.data, meta: data.meta };
		},
	});
}

/** `GET /admin/transactions/{id}`'s real response schema is undocumented
 * (see `AdminTransactionData`'s own note) — typed as `unknown` and narrowed
 * defensively at render time instead of trusting a guessed shape outright. */
function useAdminTransaction(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...TRANSACTIONS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(apiRoutes.transactions.byId(id));
			return data.data as AdminTransactionData;
		},
		enabled: !!id,
	});
}

function useInvalidateTransactions() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
}

/** Super_admin only per the backend's own guard. `reason` is a real field
 * on `AdminReverseTransactionDto` but not in its own `required` array —
 * genuinely optional, confirmed live, unlike most other reason-bearing
 * actions in this app. */
function useReverseTransaction(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateTransactions();

	return useMutation({
		mutationFn: async (payload: AdminReasonOptionalPayload) => {
			await axiosAuth.patch(apiRoutes.transactions.byIdReverse(id), payload);
		},
		onSuccess: invalidate,
	});
}

/** "Force a stuck transaction to failed status" per the endpoint's own
 * summary — same optional-reason shape as reverse above. */
function useForceTransactionStatus(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateTransactions();

	return useMutation({
		mutationFn: async (payload: AdminReasonOptionalPayload) => {
			await axiosAuth.patch(apiRoutes.transactions.byIdStatus(id), payload);
		},
		onSuccess: invalidate,
	});
}

/** "Raw ledger entries" per the endpoint's own summary — genuinely
 * undocumented shape (resolves to a bare `null` in the real spec), and
 * unlike other Phase 1/2/3 doc bugs there's no confirmed sibling schema to
 * model this on either. Kept as an array of unknown records and rendered
 * with `DynamicTable` rather than a guessed set of named columns. */
function useTransactionLedgerEntries(transactionId: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...LEDGER_ENTRIES_KEY, transactionId],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(
				apiRoutes.transactions.byIdLedgerEntries(transactionId),
			);
			return (data.data as UnknownRecord[] | null) ?? [];
		},
		enabled: !!transactionId,
	});
}

export {
	useAdminTransactions,
	useAdminTransaction,
	useReverseTransaction,
	useForceTransactionStatus,
	useTransactionLedgerEntries,
};
