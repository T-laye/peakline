"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { OtpInput } from "@repo/ui/otp-input";
import {
	Form,
	FormField,
	FormItem,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import {
	setPinSchema,
	type SetPinValues,
} from "@/lib/validations/authValidations";
import { useSetupWallet } from "@/features/auth/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

type Stage = "create" | "confirm";

/**
 * First-login step, once Sign Up's Review is confirmed — a 6-digit
 * transaction PIN, entered twice. Submitting also triggers wallet
 * generation server-side (see `useSetupWallet`).
 *
 * NOTE: Figma node 127:3302 for this screen couldn't be fetched — Figma's
 * API rate-limited this session (a plan-level cap, not transient). Built to
 * a conventional two-phase PIN pattern instead; flag anything that should
 * change once that's verified.
 */
function SetPinForm() {
	const router = useRouter();
	const [stage, setStage] = useState<Stage>("create");
	const form = useForm<SetPinValues>({
		resolver: zodResolver(setPinSchema),
		defaultValues: { pin: "", confirmPin: "" },
	});
	const setupWallet = useSetupWallet();

	function handleContinue() {
		const pin = form.getValues("pin");
		if (!/^\d{6}$/.test(pin)) {
			form.setError("pin", { message: "Enter a 6-digit PIN" });
			return;
		}
		setStage("confirm");
	}

	function onSubmit(values: SetPinValues) {
		setupWallet.mutate(
			{ pin: values.pin },
			{
				onSuccess: ({ pinAlreadySet }) => {
					// A PIN was already on file (this screen re-run after the
					// original sign-up already set one — see `useSetupWallet`'s
					// own note) — say so plainly instead of implying the PIN just
					// typed is now the active one, since it isn't.
					toast.success(
						pinAlreadySet
							? "Wallet ready — your existing PIN is still active"
							: "Wallet created",
					);
					router.push("/auth/sign-up/success");
				},
				onError: (error) => {
					toast.error(getApiErrorMessage(error, "Couldn't set up your wallet"));
				},
			},
		);
	}

	return (
		<div className="flex flex-col items-center gap-8 text-center">
			<span className="flex size-20 items-center justify-center rounded-full bg-primary-500/10">
				<ShieldCheck className="size-9 text-primary-500" aria-hidden="true" />
			</span>

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Set up your transaction PIN
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					{stage === "create"
						? "Choose a 6-digit PIN to authorize your transactions."
						: "Re-enter your PIN to confirm it."}
				</p>
			</div>

			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex w-full flex-col items-center gap-5"
				>
					{stage === "create" ? (
						<FormField
							key="pin"
							control={form.control}
							name="pin"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormControl>
										<OtpInput value={field.value} onChange={field.onChange} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					) : (
						<FormField
							key="confirmPin"
							control={form.control}
							name="confirmPin"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormControl>
										<OtpInput value={field.value} onChange={field.onChange} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					<Button
						type={stage === "create" ? "button" : "submit"}
						size="large"
						className="w-full"
						loading={setupWallet.isPending}
						onClick={stage === "create" ? handleContinue : undefined}
					>
						{stage === "create" ? "Continue" : "Confirm PIN"}
					</Button>

					{stage === "confirm" && (
						<button
							type="button"
							onClick={() => {
								setStage("create");
								form.resetField("confirmPin");
							}}
							className="text-b3 font-medium text-muted-foreground underline hover:text-foreground"
						>
							Start over
						</button>
					)}
				</form>
			</Form>
		</div>
	);
}

export { SetPinForm };
