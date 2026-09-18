"use client";

import { useState } from "react";
import { Ban, RotateCcw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { useDeactivateWallet, useReactivateWallet } from "@/features/wallets/hooks";
import { useAuthStore } from "@/lib/stores/authStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminWalletData } from "@/lib/api/types";

type DialogKind = "deactivate" | "reactivate" | null;

/** Deactivate freezes the wallet (any staff role, reason required);
 * reactivate is super_admin only per the backend's own guard (deliberately
 * a higher bar to undo a freeze than to apply one) and takes no body. */
function WalletActions({ wallet }: { wallet: AdminWalletData }) {
	const [dialog, setDialog] = useState<DialogKind>(null);
	const isSuperAdmin = useAuthStore((state) => state.staffRole === "super_admin");

	const deactivate = useDeactivateWallet(wallet.id);
	const reactivate = useReactivateWallet(wallet.id);

	function close() {
		setDialog(null);
	}

	return (
		<>
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
				<h2 className="text-b2 font-semibold text-foreground">Actions</h2>
				<div className="flex flex-wrap gap-3">
					{!wallet.deactivatedAt ? (
						<Button
							type="button"
							variant="outline"
							className="border-destructive text-destructive hover:bg-danger-50"
							onClick={() => setDialog("deactivate")}
						>
							<Ban className="size-4" aria-hidden="true" />
							Deactivate wallet
						</Button>
					) : (
						isSuperAdmin && (
							<Button type="button" variant="outline" onClick={() => setDialog("reactivate")}>
								<RotateCcw className="size-4" aria-hidden="true" />
								Reactivate wallet
							</Button>
						)
					)}
				</div>
			</div>

			<ConfirmActionDialog
				open={dialog === "deactivate"}
				onOpenChange={(open) => !open && close()}
				title="Deactivate this wallet"
				description="Freezes the wallet — no further transactions can be made from it until reactivated."
				confirmLabel="Deactivate wallet"
				destructive
				isPending={deactivate.isPending}
				onConfirm={(reason) =>
					deactivate.mutate(
						{ reason },
						{
							onSuccess: () => {
								toast.success("Wallet deactivated");
								close();
							},
							onError: (error) =>
								toast.error(getApiErrorMessage(error, "Couldn't deactivate wallet")),
						},
					)
				}
			/>

			<ConfirmActionDialog
				open={dialog === "reactivate"}
				onOpenChange={(open) => !open && close()}
				title="Reactivate this wallet"
				description="Unfreezes the wallet — it can send and receive again."
				confirmLabel="Reactivate wallet"
				reason="hidden"
				isPending={reactivate.isPending}
				onConfirm={() =>
					reactivate.mutate(undefined, {
						onSuccess: () => {
							toast.success("Wallet reactivated");
							close();
						},
						onError: (error) =>
							toast.error(getApiErrorMessage(error, "Couldn't reactivate wallet")),
					})
				}
			/>
		</>
	);
}

export { WalletActions };
