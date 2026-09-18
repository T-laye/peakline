"use client";

import { LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/dialog";
import { Logo } from "@repo/ui/logo";
import { MerchantNavList } from "@/components/layouts/MerchantNavList";
import { LogoutConfirmDialog } from "@/components/layouts/LogoutConfirmDialog";

interface MerchantMobileNavProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Merchant's mobile nav — a slide-in drawer from the hamburger button in
 * `MerchantMobileTopBar`, not `BottomTabBar` (merchant dropped that
 * entirely per the updated mock). Reuses `DialogContent` from the shared
 * `@repo/ui/dialog` (same primitive `FundWalletDialog` uses) with its
 * centered-modal positioning overridden via `className` — `tailwind-merge`
 * resolves the conflicting `top-*`/`left-*`/`translate-*`/sizing utilities
 * in favor of these, so there's no need for a second dialog primitive just
 * for this one shape. `max-h-screen` is also an override, not just
 * decoration — the base `DialogContent` caps at `max-h-[85vh]` for a
 * centered modal that shouldn't touch the viewport edges, which silently
 * capped this drawer 15vh short of full height too since nothing here had
 * targeted that utility before.
 */
function MerchantMobileNav({ open, onOpenChange }: MerchantMobileNavProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="inset-y-0 top-0 left-0 flex h-screen max-h-screen w-72 max-w-[80vw] translate-x-0 translate-y-0 flex-col gap-8 rounded-none rounded-r-2xl bg-primary-800 p-4 py-6 text-primary-100 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
			>
				<DialogTitle className="sr-only">Menu</DialogTitle>
				<div className="border-b border-primary-100/20 pb-6">
					<Logo size="lg" variant="dark" />
				</div>
				<MerchantNavList onNavigate={() => onOpenChange(false)} className="flex-1 overflow-y-auto" />
				<LogoutConfirmDialog>
					<button
						type="button"
						className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-b3 font-medium text-destructive transition-colors hover:bg-primary-700"
					>
						<LogOut className="size-4.5 shrink-0" aria-hidden="true" />
						Logout
					</button>
				</LogoutConfirmDialog>
			</DialogContent>
		</Dialog>
	);
}

export { MerchantMobileNav };
