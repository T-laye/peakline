"use client";

import { useState } from "react";
import { Lock, Unlock, ShieldCheck, UserCog, XCircle, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { SetKycTierDialog } from "@/features/users/components/SetKycTierDialog";
import { SetRoleDialog } from "@/features/users/components/SetRoleDialog";
import { ForceDeleteDialog } from "@/features/users/components/ForceDeleteDialog";
import {
	useLockUser,
	useUnlockUser,
	useSetKycTier,
	useSetUserRole,
	useCancelDeletionRequest,
	useForceDeleteUser,
} from "@/features/users/hooks";
import { useAuthStore } from "@/lib/stores/authStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { isCurrentlyLocked } from "@/features/users/utils";
import type { AdminUserData } from "@/lib/api/types";

type DialogKind = "lock" | "unlock" | "kyc" | "role" | "cancel-deletion" | "force-delete" | null;

/**
 * Every moderation action for a single user, gathered in one place on
 * `UserDetail` rather than scattered per-field — an admin reads the record
 * above, then acts here. Role change and force-delete are hidden entirely
 * for anyone but a super_admin (the backend enforces this regardless; the
 * UI hiding it is just not offering a button that would 403 anyway).
 */
function UserActions({ user }: { user: AdminUserData }) {
	const [dialog, setDialog] = useState<DialogKind>(null);
	const isSuperAdmin = useAuthStore((state) => state.staffRole === "super_admin");
	const locked = isCurrentlyLocked(user);

	const lockUser = useLockUser(user.id);
	const unlockUser = useUnlockUser(user.id);
	const setKycTier = useSetKycTier(user.id);
	const setRole = useSetUserRole(user.id);
	const cancelDeletion = useCancelDeletionRequest(user.id);
	const forceDelete = useForceDeleteUser(user.id);

	function close() {
		setDialog(null);
	}

	return (
		<>
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
				<h2 className="text-b2 font-semibold text-foreground">Actions</h2>
				<div className="flex flex-wrap gap-3">
					{locked ? (
						<Button type="button" variant="outline" onClick={() => setDialog("unlock")}>
							<Unlock className="size-4" aria-hidden="true" />
							Unlock account
						</Button>
					) : (
						<Button type="button" variant="outline" onClick={() => setDialog("lock")}>
							<Lock className="size-4" aria-hidden="true" />
							Lock account
						</Button>
					)}

					<Button type="button" variant="outline" onClick={() => setDialog("kyc")}>
						<ShieldCheck className="size-4" aria-hidden="true" />
						Set KYC tier
					</Button>

					{isSuperAdmin && (
						<Button type="button" variant="outline" onClick={() => setDialog("role")}>
							<UserCog className="size-4" aria-hidden="true" />
							Change role
						</Button>
					)}

					{user.deletionRequestedAt && !user.deletedAt && (
						<Button type="button" variant="outline" onClick={() => setDialog("cancel-deletion")}>
							<XCircle className="size-4" aria-hidden="true" />
							Cancel deletion request
						</Button>
					)}

					{isSuperAdmin && !user.deletedAt && (
						<Button
							type="button"
							variant="outline"
							className="border-destructive text-destructive hover:bg-danger-50"
							onClick={() => setDialog("force-delete")}
						>
							<Trash2 className="size-4" aria-hidden="true" />
							Force delete
						</Button>
					)}
				</div>
			</div>

			<ConfirmActionDialog
				open={dialog === "lock"}
				onOpenChange={(open) => !open && close()}
				title="Lock this account"
				description={`${user.firstName} ${user.lastName} won't be able to sign in until unlocked.`}
				confirmLabel="Lock account"
				isPending={lockUser.isPending}
				onConfirm={(reason) =>
					lockUser.mutate(
						{ reason },
						{
							onSuccess: () => {
								toast.success("Account locked");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't lock account")),
						},
					)
				}
			/>

			<ConfirmActionDialog
				open={dialog === "unlock"}
				onOpenChange={(open) => !open && close()}
				title="Unlock this account"
				description={`${user.firstName} ${user.lastName} will be able to sign in again.`}
				confirmLabel="Unlock account"
				reason="hidden"
				isPending={unlockUser.isPending}
				onConfirm={() =>
					unlockUser.mutate(undefined, {
						onSuccess: () => {
							toast.success("Account unlocked");
							close();
						},
						onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't unlock account")),
					})
				}
			/>

			<SetKycTierDialog
				open={dialog === "kyc"}
				onOpenChange={(open) => !open && close()}
				currentTier={user.kycTier}
				isPending={setKycTier.isPending}
				onConfirm={(tier, reason) =>
					setKycTier.mutate(
						{ tier, reason: reason || undefined },
						{
							onSuccess: () => {
								toast.success("KYC tier updated");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't update KYC tier")),
						},
					)
				}
			/>

			<SetRoleDialog
				open={dialog === "role"}
				onOpenChange={(open) => !open && close()}
				user={user}
				isPending={setRole.isPending}
				onConfirm={(role, staffRole, reason) =>
					setRole.mutate(
						{ role, staffRole, reason },
						{
							onSuccess: () => {
								toast.success("Role updated");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't update role")),
						},
					)
				}
			/>

			<ConfirmActionDialog
				open={dialog === "cancel-deletion"}
				onOpenChange={(open) => !open && close()}
				title="Cancel deletion request"
				description="Reverses this account's own pending deletion request — the account stays active."
				confirmLabel="Cancel deletion request"
				reason="hidden"
				isPending={cancelDeletion.isPending}
				onConfirm={() =>
					cancelDeletion.mutate(undefined, {
						onSuccess: () => {
							toast.success("Deletion request cancelled");
							close();
						},
						onError: (error) =>
							toast.error(getApiErrorMessage(error, "Couldn't cancel the deletion request")),
					})
				}
			/>

			<ForceDeleteDialog
				open={dialog === "force-delete"}
				onOpenChange={(open) => !open && close()}
				email={user.email}
				isPending={forceDelete.isPending}
				onConfirm={(reason) =>
					forceDelete.mutate(
						{ reason },
						{
							onSuccess: () => {
								toast.success("Account permanently deleted");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't delete account")),
						},
					)
				}
			/>
		</>
	);
}

export { UserActions };
