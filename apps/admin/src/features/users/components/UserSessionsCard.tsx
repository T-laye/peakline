"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { toast } from "@repo/ui/sonner";
import { DetailCard } from "@/components/data/DetailCard";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { useUserSessions, useRevokeUserSessions } from "@/features/users/hooks";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

function UserSessionsCard({ userId }: { userId: string }) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { data: sessions, isLoading } = useUserSessions(userId);
	const revokeSessions = useRevokeUserSessions(userId);

	const activeSessions = sessions?.filter((s) => !s.revokedAt) ?? [];

	return (
		<DetailCard title="Sessions">
			{isLoading ? (
				<Skeleton className="h-24 w-full" />
			) : !sessions || sessions.length === 0 ? (
				<EmptyState icon={Monitor} title="No sessions found" />
			) : (
				<div className="flex flex-col gap-3">
					{sessions.map((session) => (
						<div
							key={session.id}
							className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
						>
							<div className="flex flex-col gap-0.5">
								<span className="text-b3 text-foreground">
									Started {formatDateTime(session.createdAt)}
								</span>
								<span className="text-c1 text-muted-foreground">
									Expires {formatDateTime(session.expiresAt)}
								</span>
							</div>
							{session.revokedAt ? (
								<Badge variant="cancelled">Revoked</Badge>
							) : (
								<Badge variant="completed">Active</Badge>
							)}
						</div>
					))}
				</div>
			)}

			{activeSessions.length > 0 && (
				<Button
					type="button"
					variant="outline"
					className="self-start"
					onClick={() => setConfirmOpen(true)}
				>
					Revoke all sessions
				</Button>
			)}

			<ConfirmActionDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Revoke all sessions"
				description="Signs this account out on every device — they'll need to log in again."
				confirmLabel="Revoke all"
				destructive
				reason="hidden"
				isPending={revokeSessions.isPending}
				onConfirm={() =>
					revokeSessions.mutate(undefined, {
						onSuccess: () => {
							toast.success("All sessions revoked");
							setConfirmOpen(false);
						},
						onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't revoke sessions")),
					})
				}
			/>
		</DetailCard>
	);
}

export { UserSessionsCard };
