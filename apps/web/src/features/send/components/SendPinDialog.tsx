"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { OtpInput } from "@repo/ui/otp-input";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogDescription,
} from "@repo/ui/responsive-dialog";

const PIN_LENGTH = 6;

interface SendPinDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (pin: string) => void;
}

/**
 * The transaction-PIN step, pulled out of the Review page itself into its
 * own modal (desktop) / real bottom-sheet drawer (mobile) — same
 * `ResponsiveDialog` pattern `ChangePinDialog` already uses (see that
 * component, and `ResponsiveDialogContent`'s own note on why this moved
 * off `Dialog`'s old CSS-only `mobileSheet` approximation). Previously an
 * inline `OtpInput` at the bottom of the review screen; separating it out
 * keeps Review a pure summary and makes "authorize this specific transfer"
 * its own explicit, focused step, fully controlled (opened by
 * `ReviewTransferStep`'s own "Send" button) rather than a
 * `ResponsiveDialogTrigger`.
 */
function SendPinDialog({ open, onOpenChange, onConfirm }: SendPinDialogProps) {
	const [pin, setPin] = useState("");
	const pinComplete = pin.length === PIN_LENGTH;

	function handleOpenChange(next: boolean) {
		onOpenChange(next);
		if (!next) setPin("");
	}

	function handleSubmit() {
		if (!pinComplete) return;
		onConfirm(pin);
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Enter your PIN</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Confirm this transfer with your transaction PIN.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<div className="flex flex-col gap-5">
					<OtpInput value={pin} onChange={setPin} length={PIN_LENGTH} />
					<Button
						type="button"
						size="large"
						className="w-full"
						disabled={!pinComplete}
						onClick={handleSubmit}
					>
						Send
					</Button>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

export { SendPinDialog };
