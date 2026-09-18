"use client";

import { LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/dialog";
import { Logo } from "@repo/ui/logo";
import { AdminNavList } from "@/components/layouts/AdminNavList";
import { useLogout } from "@/features/auth/hooks";

interface AdminMobileNavProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The admin console's mobile nav — a slide-in panel from the hamburger
 * button in `Topbar`. `Sidebar` is `hidden lg:flex` with nothing standing
 * in for it below that breakpoint, so below 1024px there was no way to
 * navigate between sections at all except by typing a URL directly —
 * this is that missing piece. Reuses `DialogContent` from the shared
 * `@repo/ui/dialog` with its centered-modal positioning overridden via
 * `className`, same left-slide-in treatment apps/web's own
 * `MerchantMobileNav` already established for the identical problem there
 * (`tailwind-merge` resolves the conflicting position/sizing utilities in
 * favor of these, so there's no need for a second dialog primitive just
 * for this one shape). Light-themed, unlike that dark drawer — this app's
 * own `Sidebar` was never dark to begin with, so the mobile panel matches
 * it instead of introducing a second color scheme.
 */
function AdminMobileNav({ open, onOpenChange }: AdminMobileNavProps) {
	const logout = useLogout();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="inset-y-0 top-0 left-0 flex h-screen max-h-screen w-72 max-w-[80vw] translate-x-0 translate-y-0 flex-col gap-6 rounded-none rounded-r-2xl border-r border-border bg-background p-4 py-6 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
			>
				<DialogTitle className="sr-only">Menu</DialogTitle>
				<div className="border-b border-border pb-6">
					<Logo size="sm" />
				</div>
				<AdminNavList onNavigate={() => onOpenChange(false)} className="flex-1 overflow-y-auto" />
				<button
					type="button"
					onClick={() => logout()}
					className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-b3 font-medium text-destructive transition-colors hover:bg-danger-50"
				>
					<LogOut className="size-4.5 shrink-0" aria-hidden="true" />
					Sign Out
				</button>
			</DialogContent>
		</Dialog>
	);
}

export { AdminMobileNav };
