"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useUnreadNotificationCount } from "@/features/notifications/hooks";
import { NotificationsPanel } from "@/features/notifications/components/NotificationsPanel";

interface NotificationBellProps {
	/** `Topbar`'s own desktop bell is `size-10`; `GreetingHeader`'s mobile
	 * one is `size-9` — both share this one component + its real unread
	 * count instead of each hand-rolling the same badge/dialog wiring. */
	className?: string;
	iconClassName?: string;
}

function NotificationBell({ className, iconClassName }: NotificationBellProps) {
	const [open, setOpen] = useState(false);
	const unreadCount = useUnreadNotificationCount();

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label={
					unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"
				}
				className={cn(
					"relative flex aspect-square shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted",
					className,
				)}
			>
				<Bell className={cn("size-4.5", iconClassName)} aria-hidden="true" />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary-500 text-c3 text-primary-foreground">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			<NotificationsPanel open={open} onOpenChange={setOpen} />
		</>
	);
}

export { NotificationBell };
