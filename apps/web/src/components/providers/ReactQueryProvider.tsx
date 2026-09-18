"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

// Almost no mutation in this app sets a `mutationKey` (there was never a
// reason to — nothing reads it back), so a bare "(unkeyed)" told you a
// mutation failed without saying which one. Since nearly every mutation is
// an axios call, pulling the method+URL straight off the error itself
// (already sitting right there on `error.config`) identifies it just as
// well as a key would have, with no need to go add one to every mutation
// in the app.
function describeFailedRequest(error: unknown): string | null {
	if (!isAxiosError(error) || !error.config) return null;
	const method = (error.config.method ?? "?").toUpperCase();
	return `${method} ${error.config.url ?? "unknown"}`;
}

// Belt-and-suspenders alongside `lib/config/axios.ts`'s own request/response
// logging: that covers every HTTP call, but a queryFn/mutationFn can also
// fail *before* ever reaching axios (a thrown validation error, a bad
// `.find()` on a still-loading dependency, `useMyWallet` finding no wallet
// then something downstream not expecting `null`, ...) — those would
// otherwise settle a query into its `error` state completely silently. This
// logs every one of them, HTTP-backed or not, so nothing fails without a
// trace and a query stuck on a spinner always has a matching console line
// explaining why it stopped.
const queryCache = new QueryCache({
	onError: (error, query) => {
		console.error(
			`%c[query] %c${JSON.stringify(query.queryKey)}`,
			"color:#dc2626;font-weight:600",
			"color:inherit",
			"—",
			getApiErrorMessage(error, error instanceof Error ? error.message : "Unknown error"),
			error,
		);
	},
});

const mutationCache = new MutationCache({
	onError: (error, _variables, _context, mutation) => {
		const label = mutation.options.mutationKey
			? JSON.stringify(mutation.options.mutationKey)
			: (describeFailedRequest(error) ?? "(unkeyed, non-HTTP failure)");
		console.error(
			`%c[mutation] %c${label}`,
			"color:#dc2626;font-weight:600",
			"color:inherit",
			"—",
			getApiErrorMessage(error, error instanceof Error ? error.message : "Unknown error"),
			error,
		);
	},
});

function ReactQueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				queryCache,
				mutationCache,
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						retry: 1,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

export { ReactQueryProvider };
