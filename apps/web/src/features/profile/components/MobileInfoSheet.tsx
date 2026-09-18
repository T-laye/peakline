"use client";

import { useState } from "react";
import {
	ResponsiveDialog,
	ResponsiveDialogTrigger,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@repo/ui/responsive-dialog";

interface MobileInfoSheetProps {
	title: string;
	trigger: React.ReactNode;
	children: React.ReactNode;
}

/**
 * The mobile Profile page's own bottom-sheet pattern — "Personal
 * Information" and (merchant) "Business Information" both open their
 * desktop-tab content this way instead of navigating to a separate page,
 * per the mock. No close button (`showCloseButton={false}`) — the mock's
 * own sheets have just the drag handle plus each form's own Cancel button,
 * not a floating X too.
 */
function MobileInfoSheet({ title, trigger, children }: MobileInfoSheetProps) {
	const [open, setOpen] = useState(false);

	return (
		<ResponsiveDialog open={open} onOpenChange={setOpen}>
			<ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent showCloseButton={false} className="lg:hidden">
				<ResponsiveDialogHeader className="pr-0">
					<ResponsiveDialogTitle className="text-center">{title}</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>
				{children}
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

export { MobileInfoSheet };
