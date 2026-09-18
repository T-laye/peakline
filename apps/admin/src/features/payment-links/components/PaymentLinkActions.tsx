"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { useCancelAdminPaymentLink } from "@/features/payment-links/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { derivePaymentLinkStatus } from "@/lib/api/types";
import type { AdminPaymentLinkData } from "@/lib/api/types";

/** Only offered on a still-active link — an expired or already-cancelled
 * one has nothing left to force-cancel, matching Phase 3's own "reverse
 * only offered on completed transactions" precedent for not showing an
 * action the endpoint would just reject. Status is derived, not a real
 * field (see `derivePaymentLinkStatus`'s own note). */
function PaymentLinkActions({ link }: { link: AdminPaymentLinkData }) {
	const [open, setOpen] = useState(false);
	const cancel = useCancelAdminPaymentLink(link.id);

	if (derivePaymentLinkStatus(link) !== "active") return null;

	return (
		<>
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
				<h2 className="text-b2 font-semibold text-foreground">Actions</h2>
				<div className="flex flex-wrap gap-3">
					<Button
						type="button"
						variant="outline"
						className="border-destructive text-destructive hover:bg-danger-50"
						onClick={() => setOpen(true)}
					>
						<Ban className="size-4" aria-hidden="true" />
						Force-cancel link
					</Button>
				</div>
			</div>

			<ConfirmActionDialog
				open={open}
				onOpenChange={setOpen}
				title="Force-cancel this payment link"
				description={`"${link.title}" will stop accepting payments immediately. This can't be undone.`}
				confirmLabel="Cancel link"
				destructive
				reason="optional"
				isPending={cancel.isPending}
				onConfirm={(reason) =>
					cancel.mutate(
						{ reason: reason || undefined },
						{
							onSuccess: () => {
								toast.success("Payment link cancelled");
								setOpen(false);
							},
							onError: (error) =>
								toast.error(getApiErrorMessage(error, "Couldn't cancel payment link")),
						},
					)
				}
			/>
		</>
	);
}

export { PaymentLinkActions };
