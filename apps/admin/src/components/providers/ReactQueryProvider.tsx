"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

// Mirrors apps/web's own ReactQueryProvider — see its notes for why this
// logging exists (every query/mutation failure gets a console line, HTTP or
// not, so nothing settles into an error state silently) and why a mutation
// is identified by its request's method+URL instead of a `mutationKey`
// (almost nothing sets one).
function describeFailedRequest(error: unknown): string | null {
	if (!isAxiosError(error) || !error.config) return null;
	const method = (error.config.method ?? "?").toUpperCase();
	return `${method} ${error.config.url ?? "unknown"}`;
}

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
