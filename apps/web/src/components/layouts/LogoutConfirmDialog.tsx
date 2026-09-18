"use client";

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
import { useLogout, useLogoutAll } from "@/features/auth/hooks";

interface LogoutConfirmDialogProps {
	children: React.ReactNode;
	/** `POST /auth/logout-all` (Account settings' own "Log out of every
	 * device") instead of the plain single-session logout every other
	 * caller (Sidebar, the merchant mobile drawer, Account's mobile
	 * fallback) uses. */
	all?: boolean;
}

/**
 * Wraps whichever "Logout" trigger a caller passes in with a confirm step
 * first — logging out used to fire immediately on click, no second-guess
 * if it was hit by mistake. One shared dialog (parameterized by `all`)
 * rather than separate copies of the same confirm/cancel markup.
 */
function LogoutConfirmDialog({ children, all = false }: LogoutConfirmDialogProps) {
	const logout = useLogout();
	const logoutAll = useLogoutAll();

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{all ? "Log out of every device?" : "Log out?"}</DialogTitle>
					<DialogDescription>
						{all
							? "Every other signed-in device will be signed out too. You'll need to sign in again on all of them."
							: "You'll need to sign in again to access your account."}
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
						onClick={all ? logoutAll : logout}
					>
						Log out
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export { LogoutConfirmDialog };
