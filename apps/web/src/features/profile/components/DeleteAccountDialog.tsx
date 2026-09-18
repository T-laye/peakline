"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogClose } from "@repo/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { useRequestAccountDeletion } from "@/features/profile/hooks";

interface DeleteAccountDialogProps {
	children: React.ReactNode;
}

/**
 * The mock's own full-bleed red confirm dialog — a genuinely different
 * visual treatment from every other dialog in the app (white-on-red,
 * inverted buttons), so this builds its own `DialogContent`-equivalent
 * directly off the Radix primitives instead of the shared white one.
 *
 * The mock's own copy ("All your data will be permanently deleted and
 * cannot be recovered") is flatly wrong against the real endpoint —
 * `POST /users/me/deletion-request` schedules deletion 7 days out and is
 * cancellable any time before then (see the pending-deletion banner this
 * unlocks, now on the Account Settings tab). Telling someone their data is
 * gone forever when it's actually a reversible, week-long grace period
 * would be a real, needless scare — so the visual style is copied
 * faithfully, the text isn't.
 */
function DeleteAccountDialog({ children }: DeleteAccountDialogProps) {
	const [open, setOpen] = useState(false);
	const requestDeletion = useRequestAccountDeletion();

	function handleConfirm() {
		requestDeletion.mutate(undefined, {
			onSuccess: () => {
				toast.success("Account deletion scheduled");
				setOpen(false);
			},
			onError: (error) => {
				toast.error(getApiErrorMessage(error, "Couldn't schedule account deletion"));
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Content
					className={cn(
						"fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-6 rounded-2xl bg-danger-600 p-6 text-center text-destructive-foreground shadow-lg outline-none sm:p-8",
						"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
						"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
					)}
				>
					<DialogClose
						className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-background text-destructive outline-none transition-opacity hover:opacity-90"
						aria-label="Close"
					>
						<X className="size-4" aria-hidden="true" />
					</DialogClose>

					<DialogPrimitive.Title className="text-s1 text-white sm:text-h5">
						Are you sure you want to delete your account?
					</DialogPrimitive.Title>
					<DialogPrimitive.Description className="text-b3 text-white/90">
						Your account will be scheduled for deletion in 7 days. You can cancel any
						time before then from Account Settings — nothing is lost until the grace
						period ends.
					</DialogPrimitive.Description>

					<div className="flex gap-3">
						<DialogClose className="flex-1 rounded-lg border border-white py-3 text-btn-medium text-white transition-colors hover:bg-white/10">
							No
						</DialogClose>
						<button
							type="button"
							disabled={requestDeletion.isPending}
							onClick={handleConfirm}
							className="flex-1 rounded-lg bg-background py-3 text-btn-medium text-destructive transition-opacity hover:opacity-90 disabled:opacity-60"
						>
							{requestDeletion.isPending ? "Deleting…" : "Yes"}
						</button>
					</div>
				</DialogPrimitive.Content>
			</DialogPortal>
		</Dialog>
	);
}

export { DeleteAccountDialog };
