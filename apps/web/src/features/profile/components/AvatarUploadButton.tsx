"use client";

import { useRef } from "react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { UserAvatar } from "@/features/dashboard/components/UserAvatar";
import { useProfile, useUpdateAvatar } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { validateAvatarFile, AVATAR_ACCEPT_ATTR } from "@/lib/avatar";

/**
 * The avatar + "Change Profile" header shared by desktop's
 * `PersonalInformationTab` and the mobile Account page's own top-level
 * header — previously duplicated in both with `handleChangeProfile` just
 * toasting "Photo upload isn't available yet"; real now that
 * `POST /users/me/avatar` exists. A plain hidden `<input type="file">`
 * triggered by the button, not a dialog — nothing here needs a preview/crop
 * step the mock doesn't show.
 */
function AvatarUploadButton({ className }: { className?: string }) {
	const { data: profile } = useProfile();
	const updateAvatar = useUpdateAvatar();
	const inputRef = useRef<HTMLInputElement>(null);

	function handlePick() {
		inputRef.current?.click();
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = ""; // lets picking the exact same file twice re-fire onChange
		if (!file) return;

		const validationError = validateAvatarFile(file);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		updateAvatar.mutate(file, {
			onSuccess: () => toast.success("Profile photo updated"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't update your photo")),
		});
	}

	return (
		<div className={className}>
			<UserAvatar
				name={profile ? `${profile.firstName} ${profile.lastName}`.trim() : ""}
				avatarUrl={profile?.avatarUrl}
				className="size-20 text-h5"
			/>
			<input
				ref={inputRef}
				type="file"
				accept={AVATAR_ACCEPT_ATTR}
				className="hidden"
				onChange={handleFileChange}
			/>
			<Button
				type="button"
				size="small"
				onClick={handlePick}
				loading={updateAvatar.isPending}
			>
				Change Profile
			</Button>
		</div>
	);
}

export { AvatarUploadButton };
