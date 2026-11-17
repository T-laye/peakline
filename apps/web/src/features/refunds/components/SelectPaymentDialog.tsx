"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@repo/ui/responsive-dialog";
import { useRefundablePayments } from "@/features/refunds/hooks";
import { formatUsdc } from "@/lib/currency";
import { formatShortDate } from "./parts";

/** "Initiate refund" from the list header — the brief's "completed payment
 * selection" step. Only payments with a remaining refundable balance are
 * offered; picking one opens its Initiate Refund page. */
function SelectPaymentDialog({ triggerClassName }: { triggerClassName?: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const { data } = useRefundablePayments({ q: search.trim() || undefined }, 1, 50);
	const eligible = data?.payments.filter((p) => Number(p.remainingRefundable) > 0);

	return (
		<>
			<Button type="button" size="large" className={triggerClassName} onClick={() => setOpen(true)}>
				<Plus className="size-4" aria-hidden="true" />
				Initiate refund
			</Button>
			<ResponsiveDialog open={open} onOpenChange={setOpen}>
				<ResponsiveDialogContent className="sm:max-w-lg">
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>Select a payment</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Only verified payments with a refundable balance are shown.
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
					<div className="flex flex-col gap-3">
						<div className="relative">
							<Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by customer name"
								aria-label="Search payments"
								className="pl-10"
							/>
						</div>
						<div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
							{!eligible ? (
								<Skeleton className="h-40 w-full" />
							) : eligible.length === 0 ? (
								<p className="py-6 text-center text-b3 text-muted-foreground">No refundable payments found.</p>
							) : (
								eligible.map((p) => (
									<button
										key={p.id}
										type="button"
										onClick={() => router.push(`/refunds/${p.id}`)}
										className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
									>
										<div className="flex min-w-0 flex-col">
											<span className="truncate text-b3 font-medium text-foreground">
												{p.customer.name} · {p.title}
											</span>
											<span className="text-c1 text-muted-foreground">
												#{p.reference} · {formatShortDate(p.paidAt)}
											</span>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<div className="flex flex-col items-end">
												<span className="text-b3 font-semibold text-foreground">
													{formatUsdc(Number(p.remainingRefundable))} USDC
												</span>
												<span className="text-c2 text-muted-foreground">refundable</span>
											</div>
											<ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
										</div>
									</button>
								))
							)}
						</div>
					</div>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		</>
	);
}

export { SelectPaymentDialog };
