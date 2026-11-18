"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@repo/ui/responsive-dialog";
import { useEligiblePayments } from "@/features/refunds/hooks";
import { formatUsdc } from "@/lib/currency";
import { shortAddress } from "@/lib/reconciliation";
import { formatShortDate, shortId } from "./parts";

/** "Initiate refund" from the list header — picks from
 * `GET /refunds/eligible-payments` (payments with a refundable balance). */
function SelectPaymentDialog({ triggerClassName }: { triggerClassName?: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const { data } = useEligiblePayments(1, 100);

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
							Completed payments with a refundable balance. Refunds always go back to the original sender.
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
					<div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
						{!data ? (
							<Skeleton className="h-40 w-full" />
						) : data.payments.length === 0 ? (
							<p className="py-6 text-center text-b3 text-muted-foreground">No refundable payments yet.</p>
						) : (
							data.payments.map((p) => (
								<button
									key={p.transactionId}
									type="button"
									onClick={() => router.push(`/refunds/${p.transactionId}`)}
									className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
								>
									<div className="flex min-w-0 flex-col">
										<span className="truncate text-b3 font-medium text-foreground">
											{p.reference ?? shortId(p.transactionId)}
											{p.customerReference ? ` · ${p.customerReference}` : ""}
										</span>
										<span className="text-c1 text-muted-foreground">
											{shortAddress(p.payerAddress)} · {formatShortDate(p.completedAt)}
										</span>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<div className="flex flex-col items-end">
											<span className="text-b3 font-semibold text-foreground">
												{formatUsdc(Number(p.refundable.remaining))} USDC
											</span>
											<span className="text-c2 text-muted-foreground">refundable</span>
										</div>
										<ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
									</div>
								</button>
							))
						)}
					</div>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		</>
	);
}

export { SelectPaymentDialog };
