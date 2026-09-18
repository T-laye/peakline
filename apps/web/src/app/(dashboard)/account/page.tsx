"use client";

import { User, Store, HelpCircle, Headphones } from "lucide-react";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { AccountTabs, type AccountTab } from "@/components/layouts/AccountTabs";
import { AvatarUploadButton } from "@/features/profile/components/AvatarUploadButton";
import { WalletAddressCard } from "@/features/wallet/components/WalletAddressCard";
import {
	PersonalInformationTab,
	PersonalInformationFields,
} from "@/features/profile/components/PersonalInformationTab";
import { BusinessInformationTab } from "@/features/business/components/BusinessInformationTab";
import { AccountSettingsTab, AccountSettingsRows } from "@/features/profile/components/AccountSettingsTab";
import { PendingDeletionBanner } from "@/features/profile/components/PendingDeletionBanner";
import { InstallAppCard } from "@/features/profile/components/InstallAppCard";
import { SettingsRow } from "@/features/profile/components/SettingsRow";
import { MobileInfoSheet } from "@/features/profile/components/MobileInfoSheet";
import { useAuthStore } from "@/lib/stores/authStore";

/**
 * Two genuinely different layouts, not one responsively-scaled page — same
 * split `DashboardLayout` itself uses. Desktop (`lg` and up): a left
 * mini-nav (`AccountTabs`) switching between Personal Information,
 * [Business Information, merchant only], and Account Settings, each its
 * own panel — no page-level heading above it, matching the mock (every
 * desktop reference screen goes straight from the topbar into the tabs).
 *
 * Mobile: one scrolling "Profile" page — avatar/wallet header once at the
 * top (not repeated inside each sheet), then ONE continuous bordered card
 * holding every group in sequence (Personal Information/[Business
 * Information] -> Help & Support -> Account Settings), separated from each
 * other only by a plain rule between groups, not a divider between every
 * individual row (matching the mock exactly — reported live after an
 * earlier pass used three separately-gapped, separately-bordered blocks
 * instead of the one continuous card the mock actually shows). Personal/
 * Business Information open a bottom sheet (`MobileInfoSheet`) instead of
 * a separate route; `PendingDeletionBanner`/`InstallAppCard` render outside
 * that shared card, same as they visually did before this fix.
 *
 * Nav labels differ from this page's own title deliberately — desktop's
 * sidebar item reads "Accounts", the mobile bottom tab reads "Profile"
 * (see `Sidebar`/`MerchantNavList`/`BottomTabBar`), both matching their own
 * mock exactly; the route itself stays `/account` either way.
 */
export default function AccountPage() {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");

	const tabs: AccountTab[] = [
		{ key: "personal", label: "Personal Information", content: <PersonalInformationTab /> },
		...(isMerchant
			? [
					{
						key: "business",
						label: "Business Information",
						content: <BusinessInformationTab />,
					},
				]
			: []),
		{ key: "settings", label: "Account Settings", content: <AccountSettingsTab /> },
	];

	return (
		<div className="flex flex-1 flex-col gap-6">
			{/* No `MobileStepHeader` for merchant — `MerchantMobileTopBar` already
			    shows this route's own nav-item label ("Accounts") as a
			    back+title+hamburger bar; rendering both stacked was a real
			    duplicate-header bug on this exact page before. Individual still
			    needs its own — no equivalent top bar exists for that account
			    type, and this is a primary bottom-tab destination (no back
			    arrow), titled "Profile" to match the mock and the tab's own
			    renamed label. */}
			{!isMerchant && <MobileStepHeader title="Profile" />}

			{/* Desktop */}
			<AccountTabs tabs={tabs} />

			{/* Mobile */}
			<div className="flex flex-col gap-6 lg:hidden">
				<AvatarUploadButton className="flex flex-col items-center gap-3" />

				<WalletAddressCard />

				<PendingDeletionBanner />

				<div className="flex flex-col rounded-2xl border border-border bg-background px-5">
					<div className="flex flex-col py-2">
						<MobileInfoSheet
							title="Personal Information"
							trigger={<SettingsRow icon={User} label="Personal Information" />}
						>
							<PersonalInformationFields />
						</MobileInfoSheet>

						{isMerchant && (
							<MobileInfoSheet
								title="Business Information"
								trigger={<SettingsRow icon={Store} label="Business Information" />}
							>
								<BusinessInformationTab />
							</MobileInfoSheet>
						)}
					</div>

					<div className="flex flex-col gap-2 border-t border-border py-4">
						<span className="text-c1 font-semibold text-muted-foreground uppercase">
							Help &amp; Support
						</span>
						<div className="flex flex-col">
							<SettingsRow href="/support/faq" icon={HelpCircle} label="FAQ" />
							<SettingsRow href="/support/contact" icon={Headphones} label="Contact Support" />
						</div>
					</div>

					<div className="flex flex-col gap-2 border-t border-border py-4">
						<span className="text-c1 font-semibold text-muted-foreground uppercase">
							Account Settings
						</span>
						<AccountSettingsRows />
					</div>
				</div>

				<InstallAppCard />
			</div>
		</div>
	);
}
