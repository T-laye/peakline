"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Skeleton } from "@repo/ui/skeleton";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import { AvatarUploadButton } from "@/features/profile/components/AvatarUploadButton";
import { WalletAddressCard } from "@/features/wallet/components/WalletAddressCard";
import { useProfile, useUpdateProfile } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { profileSchema, type ProfileValues } from "@/lib/validations/profileValidations";
import type { ProfileData } from "@/lib/api/types";

function toFormValues(profile: ProfileData): ProfileValues {
	return {
		username: profile.username ?? "",
		fullName: `${profile.firstName} ${profile.lastName}`.trim(),
	};
}

function FieldsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
		</div>
	);
}

/**
 * Just the editable fields (Username/Full Name/Email/Phone + Cancel/
 * Update) — split out from the avatar/wallet-address header so mobile can
 * show that header once at the Profile page's own top level (see
 * `AccountPage`) and reuse only this part inside the "Personal
 * Information" bottom sheet, instead of duplicating the avatar inside the
 * sheet too (not part of any mock). `PersonalInformationTab` below is the
 * desktop version — header + this, together, matching that mock instead.
 *
 * Always editable, no separate Edit toggle — the mock's own Cancel/Update
 * pair is present regardless of whether anything's actually changed.
 * `fullName` is one field here (see `profileSchema`'s own note on the
 * split-at-submit shape); "Other Name" isn't shown at all anymore — the
 * mock has no field for it, and nothing else needs it edited. Email/phone
 * stay `readOnly` — the API still doesn't accept changes to either
 * (confirmed live) — but rendered with the same plain-input look as every
 * other field, matching the mock exactly, rather than a visually
 * "disabled" treatment.
 */
function PersonalInformationFields() {
	const { data: profile, isLoading, isError, error } = useProfile();
	const updateProfile = useUpdateProfile();
	const form = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: profile ? toFormValues(profile) : { username: "", fullName: "" },
	});

	// The form initializes before the query resolves — its first real
	// values arrive via this effect rather than `defaultValues`.
	useEffect(() => {
		if (profile) form.reset(toFormValues(profile));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile]);

	if (isLoading) return <FieldsSkeleton />;

	if (isError || !profile) {
		return (
			<p className="text-b3 text-muted-foreground">
				{getApiErrorMessage(error, "Couldn't load your profile.")}
			</p>
		);
	}

	function handleCancel() {
		form.reset(toFormValues(profile!));
	}

	function handleSave(values: ProfileValues) {
		updateProfile.mutate(values, {
			onSuccess: () => toast.success("Profile updated"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't update profile")),
		});
	}

	return (
		<Form {...form}>
			<form noValidate onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="fullName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Not part of `profileSchema` — permanently read-only, no endpoint
				    accepts a change to either (confirmed live). */}
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="profile-email">Email</Label>
					<Input id="profile-email" type="email" value={profile.email} readOnly />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="profile-phone">Phone Number</Label>
					<Input id="profile-phone" value={profile.phoneNumber} readOnly />
				</div>

				<div className="flex gap-3 pt-2">
					<Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
						Cancel
					</Button>
					<Button type="submit" className="flex-1" loading={updateProfile.isPending}>
						Update
					</Button>
				</div>
			</form>
		</Form>
	);
}

/**
 * The Personal Information tab — same content for both individual and
 * merchant (the mock's own merchant screenshot shows an identical panel).
 * Avatar/Change Profile + wallet address, then `PersonalInformationFields`
 * — desktop's own version of the header the mobile Profile page shows once
 * at the page level instead (see that component's own note).
 *
 * "Delete Account" and the pending-deletion banner both moved to Account
 * Settings — this tab is profile fields only now, matching the mock's own
 * split (no delete affordance appears here in any of the reference
 * screens).
 */
function PersonalInformationTab() {
	return (
		<div className="flex flex-col gap-6">
			<AvatarUploadButton className="flex flex-col items-center gap-3 sm:items-start" />

			<WalletAddressCard />

			<PersonalInformationFields />
		</div>
	);
}

export { PersonalInformationTab, PersonalInformationFields };
