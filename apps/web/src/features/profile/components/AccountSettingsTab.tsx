"use client";

import { ShieldCheck, FileText, Lock, KeyRound, LogOut, Trash2 } from "lucide-react";
import { Separator } from "@repo/ui/separator";
import { useProfile } from "@/features/profile/hooks";
import { SettingsRow } from "@/features/profile/components/SettingsRow";
import { TwoFactorSettingRow } from "@/features/profile/components/TwoFactorSettingRow";
import { ChangePinDialog } from "@/features/profile/components/ChangePinDialog";
import { ChangePasswordDialog } from "@/features/profile/components/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/features/profile/components/DeleteAccountDialog";
import { InstallAppCard } from "@/features/profile/components/InstallAppCard";
import { PendingDeletionBanner } from "@/features/profile/components/PendingDeletionBanner";
import { LogoutConfirmDialog } from "@/components/layouts/LogoutConfirmDialog";

/**
 * Just the row list (2FA, Terms, Privacy, Change PIN, Change Password,
 * Logout, Delete Account) — no dividers between individual rows, matching
 * the mock (row padding alone carries the separation; only a *group*
 * boundary, like Personal Information -> Help & Support -> Account
 * Settings on the mobile Profile page, gets an actual rule). Split out
 * from `AccountSettingsTab` so `AccountPage`'s own mobile layout can embed
 * just this inside one continuous bordered card alongside its other
 * groups, instead of this component's own banner/`InstallAppCard` forcing
 * a second, separately-bordered card there.
 */
function AccountSettingsRows() {
	const isPendingDeletion = Boolean(useProfile().data?.deletionRequestedAt);

	return (
		<div className="flex flex-col">
			<TwoFactorSettingRow />

			<SettingsRow href="/legal/terms" icon={ShieldCheck} label="Terms and Conditions" />

			<SettingsRow href="/legal/privacy" icon={FileText} label="Privacy Policy" />

			<ChangePinDialog>
				<SettingsRow icon={Lock} label="Change Transaction PIN" destructive />
			</ChangePinDialog>

			<ChangePasswordDialog>
				<SettingsRow icon={KeyRound} label="Change Password" destructive />
			</ChangePasswordDialog>

			<LogoutConfirmDialog>
				<SettingsRow icon={LogOut} label="Logout" destructive />
			</LogoutConfirmDialog>

			{!isPendingDeletion && (
				<DeleteAccountDialog>
					<SettingsRow icon={Trash2} label="Delete Account" destructive />
				</DeleteAccountDialog>
			)}
		</div>
	);
}

/**
 * The Account Settings tab — `PendingDeletionBanner` + `AccountSettingsRows`
 * + `InstallAppCard`. Desktop's own tab panel (see `AccountPage`) uses this
 * as-is; the mobile Profile page uses `AccountSettingsRows` directly
 * instead, embedding it inside one shared card with its other groups and
 * placing the banner/install card outside that card itself (see
 * `AccountPage`'s own note).
 */
function AccountSettingsTab() {
	return (
		<div className="flex flex-col gap-6">
			<PendingDeletionBanner />
			<AccountSettingsRows />
			<Separator />
			<InstallAppCard />
		</div>
	);
}

export { AccountSettingsTab, AccountSettingsRows };
