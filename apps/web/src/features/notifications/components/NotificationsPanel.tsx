"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/dialog";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { toast } from "@repo/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import {
	useNotifications,
	useMarkNotificationRead,
	useMarkAllNotificationsRead,
	useDeleteNotification,
} from "@/features/notifications/hooks";
import type { NotificationData } from "@/lib/api/types";

/** "2h ago", "3d ago", falling back to a plain date once it's old enough
 * that a relative label stops being more useful than the actual date. */
function relativeTime(iso: string) {
	const diffMs = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function NotificationRow({ notification }: { notification: NotificationData }) {
	const markRead = useMarkNotificationRead();
	const deleteOne = useDeleteNotification();
	const isUnread = !notification.readAt;

	function handleDelete() {
		deleteOne.mutate(notification.id, {
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't delete notification")),
		});
	}

	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-xl border border-border p-3",
				isUnread && "bg-primary-500/5",
			)}
		>
			<span
				className={cn("mt-1.5 size-2 shrink-0 rounded-full", isUnread ? "bg-primary-500" : "bg-transparent")}
				aria-hidden="true"
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="text-b3 font-semibold text-foreground">{notification.title}</span>
				<span className="text-c1 text-muted-foreground">{notification.body}</span>
				<span className="text-c2 text-muted-foreground">{relativeTime(notification.createdAt)}</span>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				{isUnread && (
					<button
						type="button"
						onClick={() =>
							markRead.mutate(notification.id, {
								onError: (error) =>
									toast.error(getApiErrorMessage(error, "Couldn't mark as read")),
							})
						}
						aria-label="Mark as read"
						className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<Check className="size-4" aria-hidden="true" />
					</button>
				)}
				<button
					type="button"
					onClick={handleDelete}
					aria-label="Delete notification"
					className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
				>
					<Trash2 className="size-4" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
}

/**
 * The bell's own panel — no mock exists for this (every provided screen
 * just showed the badge, never what tapping it opens), so this follows the
 * app's established Dialog-for-an-overlay-list pattern rather than
 * inventing a dropdown/popover primitive the design system doesn't have
 * yet. Real as of `GET /notifications` + the read/delete endpoints.
 */
function NotificationsPanel({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { data, isLoading } = useNotifications();
	const markAllRead = useMarkAllNotificationsRead();
	const hasUnread = data?.some((n) => !n.readAt) ?? false;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center justify-between gap-4">
						<DialogTitle>Notifications</DialogTitle>
						{hasUnread && (
							<button
								type="button"
								onClick={() =>
									markAllRead.mutate(undefined, {
										onError: (error) =>
											toast.error(getApiErrorMessage(error, "Couldn't mark all as read")),
									})
								}
								className="text-c1 font-medium text-primary hover:underline"
							>
								Mark all read
							</button>
						)}
					</div>
				</DialogHeader>

				<div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
					{isLoading ? (
						Array.from({ length: 4 }, (_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded-xl" />
						))
					) : !data || data.length === 0 ? (
						<EmptyState
							icon={Bell}
							title="No notifications yet"
							description="You'll see updates about your account and activity here."
						/>
					) : (
						data.map((notification) => (
							<NotificationRow key={notification.id} notification={notification} />
						))
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export { NotificationsPanel };
