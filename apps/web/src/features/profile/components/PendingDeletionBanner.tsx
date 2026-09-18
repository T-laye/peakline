"use client";

import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { useProfile, useCancelAccountDeletion } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/**
 * "Account scheduled for deletion" notice + Cancel action — shown wherever
 * a pending deletion request needs surfacing. Renders nothing at all when
 * there isn't one, so callers can drop this in unconditionally (desktop's
 * `AccountSettingsTab`, and the mobile Profile page's own layout, above its
 * shared settings card) rather than each checking `deletionRequestedAt`
 * themselves.
 */
function PendingDeletionBanner() {
	const { data: profile, isLoading } = useProfile();
	const cancelDeletion = useCancelAccountDeletion();
	const isPendingDeletion = Boolean(profile?.deletionRequestedAt);

	if (isLoading || !isPendingDeletion) return null;

	function handleCancelDeletion() {
		cancelDeletion.mutate(undefined, {
			onSuccess: () => toast.success("Account deletion cancelled"),
			onError: (error) => {
				toast.error(getApiErrorMessage(error, "Couldn't cancel account deletion"));
			},
		});
	}

	return (
		<div className="flex flex-col items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 p-4">
			<span className="text-b3 font-semibold text-destructive">
				Account scheduled for deletion
			</span>
			<p className="text-c1 text-muted-foreground">
				Your account will be deleted on{" "}
				{new Date(profile!.deletionScheduledAt!).toLocaleDateString(undefined, {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
				. You can cancel any time before then.
			</p>
			<Button
				type="button"
				variant="outline"
				size="small"
				loading={cancelDeletion.isPending}
				onClick={handleCancelDeletion}
			>
				Cancel Deletion
			</Button>
		</div>
	);
}

export { PendingDeletionBanner };
