"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { PasswordInput } from "@repo/ui/password-input";
import {
	ResponsiveDialog,
	ResponsiveDialogTrigger,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogDescription,
} from "@repo/ui/responsive-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import { useChangePassword } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import {
	changePasswordSchema,
	type ChangePasswordValues,
} from "@/lib/validations/accountSettingsValidations";

interface ChangePasswordDialogProps {
	children: React.ReactNode;
}

/**
 * Built to match the mock (Old Password / New Password / Update) — real
 * now (`POST /auth/change-password`), one step, no OTP/2FA confirmation
 * unlike Change PIN. A successful change revokes every session including
 * this one (`useChangePassword`'s own note), so there's no "stay here"
 * success state — the redirect to sign-in *is* the confirmation.
 */
function ChangePasswordDialog({ children }: ChangePasswordDialogProps) {
	const [open, setOpen] = useState(false);
	const changePassword = useChangePassword();
	const form = useForm<ChangePasswordValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { oldPassword: "", newPassword: "" },
	});

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) form.reset({ oldPassword: "", newPassword: "" });
	}

	function handleSubmit(values: ChangePasswordValues) {
		changePassword.mutate(values, {
			onSuccess: () => toast.success("Password changed — please log in again"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't change password")),
		});
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
			<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Change Password</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						You&apos;ll be signed out of every device once this is changed.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<Form {...form}>
					<form
						noValidate
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex flex-col gap-5"
					>
						<FormField
							control={form.control}
							name="oldPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Old Password</FormLabel>
									<FormControl>
										<PasswordInput placeholder="Enter password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>New Password</FormLabel>
									<FormControl>
										<PasswordInput placeholder="Enter password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" className="flex-1" loading={changePassword.isPending}>
								Update
							</Button>
						</div>
					</form>
				</Form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

export { ChangePasswordDialog };
