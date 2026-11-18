"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { Pagination } from "@/components/Pagination";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { formatUsdc } from "@/lib/currency";
import type { ApiSuccessResponse, CustomerCollectionData, PaginationMeta } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** `GET /merchant/reports/customers` — customer-specific payment requests
 * aggregated per customer. */
function useCustomers(q: string, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();
	return useQuery({
		queryKey: ["merchant", "report", "customers", q, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<CustomerCollectionData[]> & { meta: PaginationMeta }>(
				apiRoutes.merchant.REPORT_CUSTOMERS,
				{ params: { q: q || undefined, page, limit } },
			);
			return { customers: data.data, meta: data.meta };
		},
	});
}

const usdc = (value: string) => `${formatUsdc(Number(value))} USDC`;
const formatDate = (iso?: string | null) =>
	iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-c1 text-muted-foreground">{label}</span>
			<span className="text-b3 font-medium text-foreground">{value}</span>
		</div>
	);
}

/** Customers — everyone you've sent a payment request to, with how much
 * they've paid and how much is still outstanding. Search goes to the
 * server (`q`: name or email); a customer's own requests open the Payment
 * Requests list filtered by them. No mock exists for this screen; it
 * follows the Payment Requests list's look. */
function CustomersList() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const { data, isLoading } = useCustomers(search.trim(), page, pageSize);

	return (
		<div className="flex flex-col gap-4">
			<div className="relative">
				<Search
					className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					placeholder="Search by name or email"
					aria-label="Search customers"
					className="pl-10"
				/>
			</div>

			{isLoading || !data ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : data.customers.length === 0 ? (
				<div className="rounded-2xl border border-border bg-background">
					<EmptyState
						icon={Users}
						title={search ? "No matching customers" : "No customers yet"}
						description="Customers appear here once you send them a payment request."
						action={
							<Button asChild size="large">
								<Link href="/payment-requests/create">
									<Plus className="size-4" aria-hidden="true" />
									Create Payment Request
								</Link>
							</Button>
						}
					/>
				</div>
			) : (
				<>
					<div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
						<table className="w-full border-collapse text-left">
							<thead>
								<tr className="bg-muted">
									{["Customer", "Requests", "Paid", "Amount paid", "Outstanding", "Last request"].map((h) => (
										<th key={h} className="p-4 text-label whitespace-nowrap text-muted-foreground">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{data.customers.map((c) => (
									<tr key={`${c.customerEmail}-${c.customerName}`} className="border-t border-border hover:bg-muted/50">
										<td className="p-4">
											<Link
												href={`/payment-requests?q=${encodeURIComponent(c.customerEmail ?? c.customerName ?? "")}`}
												className="flex flex-col hover:underline"
											>
												<span className="text-b3 font-medium text-foreground">{c.customerName ?? c.customerEmail}</span>
												{c.customerName && c.customerEmail && (
													<span className="text-c1 text-muted-foreground">{c.customerEmail}</span>
												)}
											</Link>
										</td>
										<td className="p-4 text-b3 text-foreground">{c.requests}</td>
										<td className="p-4 text-b3 text-foreground">{c.paidRequests}</td>
										<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(c.paidAmount)}</td>
										<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(c.outstandingAmount)}</td>
										<td className="p-4 text-b3 whitespace-nowrap text-foreground">{formatDate(c.lastRequestAt)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="flex flex-col gap-3 lg:hidden">
						{data.customers.map((c) => (
							<Link
								key={`${c.customerEmail}-${c.customerName}`}
								href={`/payment-requests?q=${encodeURIComponent(c.customerEmail ?? c.customerName ?? "")}`}
								className="flex flex-col gap-3 rounded-xl border border-border p-4"
							>
								<CardRow label="Customer" value={c.customerName ?? c.customerEmail} />
								<CardRow label="Requests" value={`${c.paidRequests} of ${c.requests} paid`} />
								<CardRow label="Amount paid" value={usdc(c.paidAmount)} />
								<CardRow label="Outstanding" value={usdc(c.outstandingAmount)} />
							</Link>
						))}
					</div>
					<Pagination
						page={data.meta.currentPage}
						totalPages={Math.max(1, data.meta.pageCount)}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={(value) => {
							setPageSize(value);
							setPage(1);
						}}
						pageSizeOptions={PAGE_SIZE_OPTIONS}
						itemsShown={data.customers.length}
						total={data.meta.totalCount}
					/>
				</>
			)}
		</div>
	);
}

export { CustomersList };
