"use client";

import { useState } from "react";
import { BadgeCheck, Ban, RotateCcw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { useVerifyBusiness, useSuspendBusiness, useReactivateBusiness } from "@/features/businesses/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminBusinessData } from "@/lib/api/types";

type DialogKind = "verify" | "suspend" | "reactivate" | null;

/** Every business-status action in one place, mirroring `UserActions`'
 * shape — only the action relevant to the business's *current* status
 * renders (a `pending_verification` business can be verified or suspended;
 * an `active` one can be suspended; a `suspended` one can be reactivated). */
function BusinessActions({ business }: { business: AdminBusinessData }) {
	const [dialog, setDialog] = useState<DialogKind>(null);

	const verify = useVerifyBusiness(business.id);
	const suspend = useSuspendBusiness(business.id);
	const reactivate = useReactivateBusiness(business.id);

	function close() {
		setDialog(null);
	}

	return (
		<>
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
				<h2 className="text-b2 font-semibold text-foreground">Actions</h2>
				<div className="flex flex-wrap gap-3">
					{business.status === "pending_verification" && (
						<Button type="button" variant="outline" onClick={() => setDialog("verify")}>
							<BadgeCheck className="size-4" aria-hidden="true" />
							Verify business
						</Button>
					)}

					{business.status !== "suspended" && (
						<Button
							type="button"
							variant="outline"
							className="border-destructive text-destructive hover:bg-danger-50"
							onClick={() => setDialog("suspend")}
						>
							<Ban className="size-4" aria-hidden="true" />
							Suspend business
						</Button>
					)}

					{business.status === "suspended" && (
						<Button type="button" variant="outline" onClick={() => setDialog("reactivate")}>
							<RotateCcw className="size-4" aria-hidden="true" />
							Reactivate business
						</Button>
					)}
				</div>
			</div>

			<ConfirmActionDialog
				open={dialog === "verify"}
				onOpenChange={(open) => !open && close()}
				title="Verify this business"
				description={`Marks "${business.name}" as verified.`}
				confirmLabel="Verify business"
				reason="optional"
				isPending={verify.isPending}
				onConfirm={(reason) =>
					verify.mutate(
						{ reason: reason || undefined },
						{
							onSuccess: () => {
								toast.success("Business verified");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't verify business")),
						},
					)
				}
			/>

			<ConfirmActionDialog
				open={dialog === "suspend"}
				onOpenChange={(open) => !open && close()}
				title="Suspend this business"
				description={`"${business.name}" won't be able to accept payments until reactivated.`}
				confirmLabel="Suspend business"
				destructive
				isPending={suspend.isPending}
				onConfirm={(reason) =>
					suspend.mutate(
						{ reason },
						{
							onSuccess: () => {
								toast.success("Business suspended");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't suspend business")),
						},
					)
				}
			/>

			<ConfirmActionDialog
				open={dialog === "reactivate"}
				onOpenChange={(open) => !open && close()}
				title="Reactivate this business"
				description={`Restores "${business.name}" to active status.`}
				confirmLabel="Reactivate business"
				reason="optional"
				isPending={reactivate.isPending}
				onConfirm={(reason) =>
					reactivate.mutate(
						{ reason: reason || undefined },
						{
							onSuccess: () => {
								toast.success("Business reactivated");
								close();
							},
							onError: (error) =>
								toast.error(getApiErrorMessage(error, "Couldn't reactivate business")),
						},
					)
				}
			/>
		</>
	);
}

export { BusinessActions };
