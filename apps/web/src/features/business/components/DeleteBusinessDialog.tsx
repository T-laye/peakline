"use client";

import { useState } from "react";
import {
	Dialog,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { useDeleteBusiness } from "@/features/business/hooks";

interface DeleteBusinessDialogProps {
	children: React.ReactNode;
	businessId: string;
	businessName: string;
	onDeleted: () => void;
}

/** An immediate, irreversible delete — unlike `DeleteAccountDialog`'s own
 * "Delete Account" (a 7-day cancellable grace period under the hood), this
 * one has no undo, so it's worth its own confirm step first. Controlled
 * (not just a `DialogTrigger`-wrapped Cancel) so a successful delete can
 * close it itself rather than leaving it open behind the toast. */
function DeleteBusinessDialog({
	children,
	businessId,
	businessName,
	onDeleted,
}: DeleteBusinessDialogProps) {
	const [open, setOpen] = useState(false);
	const deleteBusiness = useDeleteBusiness(businessId);

	function handleConfirm() {
		deleteBusiness.mutate(undefined, {
			onSuccess: () => {
				toast.success("Business deleted");
				setOpen(false);
				onDeleted();
			},
			onError: (error) => {
				toast.error(getApiErrorMessage(error, "Couldn't delete business"));
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete {businessName}?</DialogTitle>
					<DialogDescription>
						This removes your business profile from Peakline. This can&apos;t be
						undone.
					</DialogDescription>
				</DialogHeader>
				<div className="flex gap-3">
					<DialogClose asChild>
						<Button type="button" variant="outline" className="flex-1">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						variant="destructive"
						className="flex-1"
						loading={deleteBusiness.isPending}
						onClick={handleConfirm}
					>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export { DeleteBusinessDialog };
