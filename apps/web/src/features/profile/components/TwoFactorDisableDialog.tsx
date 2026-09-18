"use client";

import { useState } from "react";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@repo/ui/dialog";
import { toast } from "@repo/ui/sonner";
import { VerifyCodeForm } from "@/features/auth/components/VerifyCodeForm";
import { useDisable2fa } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

interface TwoFactorDisableDialogProps {
	children: React.ReactNode;
	onDisabled: () => void;
}

/** Disable-2FA flow — the backend requires a current TOTP code to authorise
 * this (not a password), so it's a single `VerifyCodeForm` step rather than
 * a plain confirm dialog. */
function TwoFactorDisableDialog({ children, onDisabled }: TwoFactorDisableDialogProps) {
	const [open, setOpen] = useState(false);
	const disable = useDisable2fa();

	function handleSubmit(values: { code: string }) {
		disable.mutate(values.code, {
			onSuccess: () => {
				toast.success("2-factor authentication turned off");
				setOpen(false);
				onDisabled();
			},
			onError: (error) => {
				toast.error(getApiErrorMessage(error, "Invalid code"));
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Disable 2-factor authentication</DialogTitle>
					<DialogDescription>
						Enter the current code from your authenticator app to confirm.
					</DialogDescription>
				</DialogHeader>
				<VerifyCodeForm
					method="authenticator"
					submitLabel="Disable 2FA"
					isPending={disable.isPending}
					onSubmit={handleSubmit}
				/>
			</DialogContent>
		</Dialog>
	);
}

export { TwoFactorDisableDialog };
