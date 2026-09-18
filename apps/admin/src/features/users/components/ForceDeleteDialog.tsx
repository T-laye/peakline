"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@repo/ui/dialog";

interface ForceDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	email: string;
	isPending: boolean;
	onConfirm: (reason: string) => void;
}

/** The one action in this whole console with no undo — "Immediately
 * finalize account deletion" per the endpoint's own summary. The shared
 * `ConfirmActionDialog`'s reason field alone felt too easy to click through
 * for something this irreversible, so this adds a second, deliberately
 * slower gate: retype the account's own email before Confirm even enables. */
function ForceDeleteDialog({ open, onOpenChange, email, isPending, onConfirm }: ForceDeleteDialogProps) {
	const [confirmText, setConfirmText] = useState("");
	const [reason, setReason] = useState("");
	const canConfirm = confirmText.trim().toLowerCase() === email.toLowerCase() && reason.trim().length > 0;

	function handleOpenChange(next: boolean) {
		if (!next) {
			setConfirmText("");
			setReason("");
		}
		onOpenChange(next);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Permanently delete this account</DialogTitle>
					<DialogDescription>
						This immediately and irreversibly finalizes deletion — there is no undo.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="force-delete-reason">Reason</Label>
					<Textarea
						id="force-delete-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Why is this account being force-deleted?"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="force-delete-confirm">
						Type <span className="font-semibold text-foreground">{email}</span> to confirm
					</Label>
					<Input
						id="force-delete-confirm"
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						autoComplete="off"
					/>
				</div>

				<DialogFooter className="sm:flex-row sm:justify-end">
					<DialogClose asChild>
						<Button type="button" variant="outline" className="w-full sm:w-auto">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						variant="destructive"
						disabled={!canConfirm}
						loading={isPending}
						onClick={() => onConfirm(reason.trim())}
						className="w-full sm:w-auto"
					>
						Permanently delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ForceDeleteDialog };
