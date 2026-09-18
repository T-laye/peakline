"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";

// Trimmed version of apps/web's own provider (see that file's comments for
// the full rationale) — this app has no axios layer to pull a method+URL
// off of, since every mutation here is still `fakeRequest`-stubbed, so the
// failure label is just whatever mutationKey the call sites set.
const queryCache = new QueryCache({
	onError: (error, query) => {
		console.error(
			`%c[query] %c${JSON.stringify(query.queryKey)}`,
			"color:#dc2626;font-weight:600",
			"color:inherit",
			"—",
			error instanceof Error ? error.message : "Unknown error",
			error,
		);
	},
});

const mutationCache = new MutationCache({
	onError: (error, _variables, _context, mutation) => {
		const label = mutation.options.mutationKey
			? JSON.stringify(mutation.options.mutationKey)
			: "(unkeyed)";
		console.error(
			`%c[mutation] %c${label}`,
			"color:#dc2626;font-weight:600",
			"color:inherit",
			"—",
			error instanceof Error ? error.message : "Unknown error",
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

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { ReactQueryProvider };
