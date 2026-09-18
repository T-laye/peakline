"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { OtpInput } from "@repo/ui/otp-input";
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
import { useChangePin, useConfirmChangePin } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { changePinSchema, type ChangePinValues } from "@/lib/validations/accountSettingsValidations";

type Step = "form" | "confirm";

interface ChangePinDialogProps {
	children: React.ReactNode;
}

/**
 * Two steps, even though every mock of this only shows one (Old PIN / New
 * PIN / Update) — `PATCH /users/pin` (step 1) never actually applies the
 * new PIN by itself; it only sends an OTP (or, if the account has 2FA on,
 * expects a TOTP code instead) that `POST /users/pin/confirm` (step 2) has
 * to verify before the change takes effect. Skipping straight from the
 * mock's own form to "done" would leave the PIN unchanged with no
 * indication anything was wrong, so this adds the confirm step the real
 * endpoint requires rather than matching the mock literally. Same
 * mobile-sheet treatment as the mock's own bottom-sheet screens.
 */
function ChangePinDialog({ children }: ChangePinDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<Step>("form");
	const [requiresTwoFa, setRequiresTwoFa] = useState(false);
	const [code, setCode] = useState("");
	const changePin = useChangePin();
	const confirmChangePin = useConfirmChangePin();
	const form = useForm<ChangePinValues>({
		resolver: zodResolver(changePinSchema),
		defaultValues: { oldPin: "", newPin: "" },
	});

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) {
			setStep("form");
			setCode("");
			form.reset({ oldPin: "", newPin: "" });
		}
	}

	function handleSubmitForm(values: ChangePinValues) {
		changePin.mutate(values, {
			onSuccess: (data) => {
				setRequiresTwoFa(data.requiresTwoFa);
				setStep("confirm");
			},
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't start PIN change")),
		});
	}

	function handleConfirm() {
		confirmChangePin.mutate(code, {
			onSuccess: () => {
				toast.success("PIN changed");
				handleOpenChange(false);
			},
			onError: (error) => toast.error(getApiErrorMessage(error, "Invalid code")),
		});
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
			<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent>
				{step === "form" ? (
					<>
						<ResponsiveDialogHeader>
							<ResponsiveDialogTitle>Change Transaction PIN</ResponsiveDialogTitle>
						</ResponsiveDialogHeader>
						<Form {...form}>
							<form
								noValidate
								onSubmit={form.handleSubmit(handleSubmitForm)}
								className="flex flex-col gap-5"
							>
								<FormField
									control={form.control}
									name="oldPin"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Old PIN</FormLabel>
											<FormControl>
												<OtpInput value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="newPin"
									render={({ field }) => (
										<FormItem>
											<FormLabel>New PIN</FormLabel>
											<FormControl>
												<OtpInput value={field.value} onChange={field.onChange} />
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
									<Button type="submit" className="flex-1" loading={changePin.isPending}>
										Update
									</Button>
								</div>
							</form>
						</Form>
					</>
				) : (
					<>
						<ResponsiveDialogHeader>
							<ResponsiveDialogTitle>Confirm PIN change</ResponsiveDialogTitle>
							<ResponsiveDialogDescription>
								{requiresTwoFa
									? "Enter the 6-digit code from your authenticator app."
									: "Enter the 6-digit code we emailed you to confirm this change."}
							</ResponsiveDialogDescription>
						</ResponsiveDialogHeader>
						<div className="flex flex-col gap-5">
							<OtpInput value={code} onChange={setCode} />
							<div className="flex gap-3">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => setStep("form")}
								>
									Back
								</Button>
								<Button
									type="button"
									className="flex-1"
									loading={confirmChangePin.isPending}
									disabled={code.length !== 6}
									onClick={handleConfirm}
								>
									Confirm
								</Button>
							</div>
						</div>
					</>
				)}
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

export { ChangePinDialog };
