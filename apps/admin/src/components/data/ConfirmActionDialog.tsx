"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { HelperText } from "@repo/ui/helper-text";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@repo/ui/dialog";

type ReasonMode = "required" | "optional" | "hidden";

interface ConfirmActionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	/** Every moderation DTO on the real API takes some shape of
	 * `{ reason?: string }` — one dialog covers lock/suspend/verify/2FA
	 * disable/etc. rather than a bespoke form per action, but the three real
	 * shapes that show up (confirmed live per-DTO) all need distinct
	 * handling: `"required"` (the common case — reason is in the DTO's own
	 * `required` array, e.g. lock, suspend, role change), `"optional"`
	 * (reason is a real field but not required, e.g. verify, reactivate —
	 * still worth collecting for the audit trail, just not blocking on it),
	 * `"hidden"` (the endpoint takes no body at all, e.g. unlock, cancel
	 * deletion, revoke sessions — asking for a reason here would silently
	 * go nowhere, since the mutation never sends it). */
	reason?: ReasonMode;
	/** Red confirm button for the truly destructive/irreversible ones
	 * (force-delete, reverse, 2FA disable) — everything else uses the
	 * default primary treatment even though it's still a real moderation
	 * action, since it's not a one-way door. */
	destructive?: boolean;
	isPending?: boolean;
	onConfirm: (reason: string) => void;
}

/**
 * The one confirm(-with-reason) dialog every admin mutation reuses — see
 * `reason`'s own note above for why it takes three modes instead of a
 * boolean. Resets its own reason field each time it opens rather than
 * persisting stale text from a previous, different action.
 */
function ConfirmActionDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	reason: reasonMode = "required",
	destructive = false,
	isPending = false,
	onConfirm,
}: ConfirmActionDialogProps) {
	const [reason, setReason] = useState("");
	const [touched, setTouched] = useState(false);
	const isRequired = reasonMode === "required";
	const reasonMissing = isRequired && touched && reason.trim().length === 0;

	function handleOpenChange(next: boolean) {
		if (!next) {
			setReason("");
			setTouched(false);
		}
		onOpenChange(next);
	}

	function handleConfirm() {
		if (isRequired && reason.trim().length === 0) {
			setTouched(true);
			return;
		}
		onConfirm(reason.trim());
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{reasonMode !== "hidden" && (
					<div className="flex flex-col gap-1.5">
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							onBlur={() => setTouched(true)}
							placeholder={
								isRequired
									? "Reason for this action — shown on the account's own record and the audit log"
									: "Reason (optional) — shown on the account's own record and the audit log"
							}
							aria-invalid={reasonMissing}
							aria-label="Reason"
						/>
						{reasonMissing && <HelperText error>A reason is required</HelperText>}
					</div>
				)}

				<DialogFooter className="sm:flex-row sm:justify-end">
					<DialogClose asChild>
						<Button type="button" variant="outline" className="w-full sm:w-auto">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						variant={destructive ? "destructive" : "primary"}
						loading={isPending}
						onClick={handleConfirm}
						className="w-full sm:w-auto"
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ConfirmActionDialog };
