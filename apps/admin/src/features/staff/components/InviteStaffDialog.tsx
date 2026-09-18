"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PhoneInput } from "@repo/ui/phone-input";
import { Select } from "@repo/ui/select";
import { toast } from "@repo/ui/sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/form";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@repo/ui/dialog";
import { CopyButton } from "@/components/data/CopyButton";
import { useInviteStaff } from "@/features/staff/hooks";
import { inviteStaffSchema, type InviteStaffValues } from "@/lib/validations/staffValidations";
import { splitPhoneForApi } from "@/lib/phone";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminInviteStaffResponseData, StaffRole } from "@/lib/api/types";

const STAFF_ROLES: StaffRole[] = ["admin", "super_admin", "support", "compliance", "operations"];

interface InviteStaffDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Invite is Phase 4's one action with a real multi-field form rather than
 * `ConfirmActionDialog`'s reason box — modeled on apps/web's own sign-up
 * form conventions (react-hook-form + zod + `PhoneInput`). Success swaps
 * the form for a one-time reveal of the server-generated temporary
 * password (`AdminInviteStaffResponseData.temporaryPassword`) — shown
 * exactly once, here, never re-fetchable afterwards (see that field's own
 * note) — so closing this dialog is a genuine "I've saved it" step, not
 * just dismissal.
 */
function InviteStaffDialog({ open, onOpenChange }: InviteStaffDialogProps) {
	const [result, setResult] = useState<AdminInviteStaffResponseData | null>(null);
	const invite = useInviteStaff();
	const form = useForm<InviteStaffValues>({
		resolver: zodResolver(inviteStaffSchema),
		defaultValues: { firstName: "", lastName: "", email: "", phone: "", staffRole: "support" },
	});

	function handleOpenChange(next: boolean) {
		if (!next) {
			form.reset();
			setResult(null);
		}
		onOpenChange(next);
	}

	function onSubmit(values: InviteStaffValues) {
		const split = splitPhoneForApi(values.phone);
		if (!split) {
			form.setError("phone", { message: "Enter a valid phone number" });
			return;
		}
		invite.mutate(
			{
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				phoneNumber: split.phoneNumber,
				countryCode: split.countryCode,
				staffRole: values.staffRole,
			},
			{
				onSuccess: setResult,
				onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't invite staff member")),
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				{result ? (
					<>
						<DialogHeader>
							<DialogTitle>Staff member invited</DialogTitle>
							<DialogDescription>
								{result.firstName} {result.lastName} ({result.email}) can sign in with the
								temporary password below — this is the only time it&apos;s shown.
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted p-4">
							<code className="text-b2 font-mono text-foreground">{result.temporaryPassword}</code>
							<CopyButton value={result.temporaryPassword} />
						</div>

						<DialogFooter className="sm:flex-row sm:justify-end">
							<Button type="button" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
								Done
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Invite a staff member</DialogTitle>
							<DialogDescription>
								Creates the account immediately with a temporary password — no email is sent
								from here.
							</DialogDescription>
						</DialogHeader>

						<Form {...form}>
							<form
								noValidate
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
							>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="firstName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>First name</FormLabel>
												<FormControl>
													<Input autoComplete="given-name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="lastName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Last name</FormLabel>
												<FormControl>
													<Input autoComplete="family-name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="email" autoComplete="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone number</FormLabel>
											<FormControl>
												<PhoneInput
													name={field.name}
													value={field.value}
													onChange={field.onChange}
													onBlur={field.onBlur}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="staffRole"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Staff role</FormLabel>
											<FormControl>
												<Select {...field}>
													{STAFF_ROLES.map((role) => (
														<option key={role} value={role}>
															{role.replace(/_/g, " ")}
														</option>
													))}
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<DialogFooter className="sm:flex-row sm:justify-end">
									<DialogClose asChild>
										<Button type="button" variant="outline" className="w-full sm:w-auto">
											Cancel
										</Button>
									</DialogClose>
									<Button type="submit" loading={invite.isPending} className="w-full sm:w-auto">
										Send invite
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

export { InviteStaffDialog };
