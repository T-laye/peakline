"use client";

import { useState } from "react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { useUserTwoFaStatus, useDisableUserTwoFa } from "@/features/users/hooks";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

function UserTwoFaCard({ userId }: { userId: string }) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { data: status, isLoading } = useUserTwoFaStatus(userId);
	const disableTwoFa = useDisableUserTwoFa(userId);

	return (
		<DetailCard title="Two-Factor Authentication">
			{isLoading || !status ? (
				<Skeleton className="h-16 w-full" />
			) : (
				<>
					<FieldRow
						label="Status"
						value={
							status.enabled ? (
								<Badge variant="completed">Enabled</Badge>
							) : (
								<Badge variant="cancelled">Disabled</Badge>
							)
						}
					/>
					{status.verifiedAt && (
						<FieldRow label="Enabled since" value={formatDateTime(status.verifiedAt)} />
					)}
				</>
			)}

			{status?.enabled && (
				<Button
					type="button"
					variant="outline"
					className="self-start border-destructive text-destructive hover:bg-danger-50"
					onClick={() => setConfirmOpen(true)}
				>
					Disable 2FA
				</Button>
			)}

			<ConfirmActionDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Disable two-factor authentication"
				description="Account recovery only — removes this account's own authenticator requirement so they can log in and re-enroll."
				confirmLabel="Disable 2FA"
				destructive
				isPending={disableTwoFa.isPending}
				onConfirm={(reason) =>
					disableTwoFa.mutate(
						{ reason },
						{
							onSuccess: () => {
								toast.success("2FA disabled");
								setConfirmOpen(false);
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't disable 2FA")),
						},
					)
				}
			/>
		</DetailCard>
	);
}

export { UserTwoFaCard };
