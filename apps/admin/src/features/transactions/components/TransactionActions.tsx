"use client";

import { useState } from "react";
import { Undo2, OctagonX } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { useReverseTransaction, useForceTransactionStatus } from "@/features/transactions/hooks";
import { useAuthStore } from "@/lib/stores/authStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminTransactionData } from "@/lib/api/types";

type DialogKind = "reverse" | "force-status" | null;

/**
 * The two highest-blast-radius actions in this whole console — reversing
 * money that already moved, or force-failing a transaction stuck between
 * states. Both super_admin only per the backend's own guard; the UI hides
 * them from every other role rather than offering a button that would 403.
 * Reverse only makes sense on a `completed` transaction; force-status only
 * on one NOT already in a final state (`completed`/`failed`/`reversed`) —
 * "force a *stuck* transaction" per its own summary, not a normal one.
 */
function TransactionActions({ transaction }: { transaction: AdminTransactionData }) {
	const [dialog, setDialog] = useState<DialogKind>(null);
	const isSuperAdmin = useAuthStore((state) => state.staffRole === "super_admin");

	const reverse = useReverseTransaction(transaction.id);
	const forceStatus = useForceTransactionStatus(transaction.id);

	if (!isSuperAdmin) return null;

	const canReverse = transaction.status === "completed";
	const canForceStatus = !["completed", "failed", "reversed"].includes(transaction.status);

	if (!canReverse && !canForceStatus) return null;

	function close() {
		setDialog(null);
	}

	return (
		<>
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
				<h2 className="text-b2 font-semibold text-foreground">Actions</h2>
				<div className="flex flex-wrap gap-3">
					{canReverse && (
						<Button
							type="button"
							variant="outline"
							className="border-destructive text-destructive hover:bg-danger-50"
							onClick={() => setDialog("reverse")}
						>
							<Undo2 className="size-4" aria-hidden="true" />
							Reverse transaction
						</Button>
					)}
					{canForceStatus && (
						<Button
							type="button"
							variant="outline"
							className="border-destructive text-destructive hover:bg-danger-50"
							onClick={() => setDialog("force-status")}
						>
							<OctagonX className="size-4" aria-hidden="true" />
							Force to failed
						</Button>
					)}
				</div>
			</div>

			<ConfirmActionDialog
				open={dialog === "reverse"}
				onOpenChange={(open) => !open && close()}
				title="Reverse this transaction"
				description="Reverses the ledger movement this transaction already made — the money moves back. This can't be undone."
				confirmLabel="Reverse transaction"
				reason="optional"
				destructive
				isPending={reverse.isPending}
				onConfirm={(reason) =>
					reverse.mutate(
						{ reason: reason || undefined },
						{
							onSuccess: () => {
								toast.success("Transaction reversed");
								close();
							},
							onError: (error) =>
								toast.error(getApiErrorMessage(error, "Couldn't reverse transaction")),
						},
					)
				}
			/>

			<ConfirmActionDialog
				open={dialog === "force-status"}
				onOpenChange={(open) => !open && close()}
				title="Force this transaction to failed"
				description="For a transaction stuck between states (e.g. an upstream callback that never arrived) — marks it failed so it stops blocking anything waiting on it."
				confirmLabel="Force to failed"
				reason="optional"
				destructive
				isPending={forceStatus.isPending}
				onConfirm={(reason) =>
					forceStatus.mutate(
						{ reason: reason || undefined },
						{
							onSuccess: () => {
								toast.success("Transaction forced to failed");
								close();
							},
							onError: (error) =>
								toast.error(getApiErrorMessage(error, "Couldn't update transaction status")),
						},
					)
				}
			/>
		</>
	);
}

export { TransactionActions };
