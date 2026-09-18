"use client";

import { Fingerprint } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Switch } from "@repo/ui/switch";
import { useAccountSettingsStore } from "@/lib/stores/accountSettingsStore";
import { TwoFactorEnrollDialog } from "@/features/profile/components/TwoFactorEnrollDialog";
import { TwoFactorDisableDialog } from "@/features/profile/components/TwoFactorDisableDialog";

/**
 * Two-Factor Authentication's own settings row — a plain `<div>`, not
 * `SettingsRow` (every other row here is one, but this one's trailing
 * slot is itself an interactive control — a `Switch`/`Button` wrapped in
 * a dialog trigger — and `SettingsRow` renders a `<button>` root
 * specifically so it doubles as a dialog trigger elsewhere; nesting a
 * button inside a button is invalid HTML).
 *
 * Not a fully symmetric toggle, matching the mock's own two distinct
 * states: enabled shows a real `Switch` already in the on position
 * (tapping it opens the disable flow); disabled shows a plain outlined
 * "Enable" button, not a switch flipped off. Same enroll/disable dialogs
 * as before — only the trigger's own look changed.
 */
function TwoFactorSettingRow() {
	const has2FA = useAccountSettingsStore((state) => state.has2FA);
	const setHas2FA = useAccountSettingsStore((state) => state.setHas2FA);

	return (
		<div className="flex items-center justify-between gap-4 py-3">
			<span className="flex items-center gap-3">
				<Fingerprint className="size-5 text-foreground" aria-hidden="true" />
				<span className="text-b3 font-medium text-foreground sm:text-b2">
					Two-Factor Authentication
				</span>
			</span>

			{has2FA ? (
				<TwoFactorDisableDialog onDisabled={() => setHas2FA(false)}>
					<Switch
						checked
						onCheckedChange={() => {}}
						aria-label="Disable two-factor authentication"
					/>
				</TwoFactorDisableDialog>
			) : (
				<TwoFactorEnrollDialog onEnabled={() => setHas2FA(true)}>
					<Button type="button" variant="outline" size="small">
						Enable
					</Button>
				</TwoFactorEnrollDialog>
			)}
		</div>
	);
}

export { TwoFactorSettingRow };
