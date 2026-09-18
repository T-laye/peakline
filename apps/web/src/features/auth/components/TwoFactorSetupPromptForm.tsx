"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useLoginFlowStore } from "@/lib/stores/loginFlowStore";
import { useRouteAfterLogin } from "@/features/auth/hooks";

/**
 * Reached right after a successful Sign In, only when the account doesn't
 * already have 2FA enabled — a one-time, skippable nudge rather than a
 * mandatory gate. "Continue" goes straight to the code-entry step
 * (`LoginVerifyForm`) — authenticator app is the only 2FA method this
 * backend supports (email isn't a separate "method" to choose; it's
 * already the login step itself), so there's nothing left to pick.
 * Completing that step is what actually turns 2FA on.
 */
function TwoFactorSetupPromptForm() {
	const router = useRouter();
	const email = useLoginFlowStore((state) => state.email);
	const setTwoFactorMethod = useLoginFlowStore((state) => state.setTwoFactorMethod);
	const routeAfterLogin = useRouteAfterLogin();

	// Reached without a completed Sign In in this session — send them back.
	useEffect(() => {
		if (!email) {
			router.replace("/auth/sign-in");
		}
	}, [email, router]);

	if (!email) return null;

	// Deliberately doesn't reset `loginFlowStore` here — this component's own
	// guard above re-fires the moment `email` is cleared (still mounted while
	// clearing it), which raced this very push and won, landing back on
	// Sign In instead. The next real sign-in overwrites the store fresh
	// anyway, so there's nothing to actually clean up by clearing it now.
	function handleSkip() {
		routeAfterLogin();
	}

	return (
		<div className="flex flex-col items-center gap-8 text-center">
			<span className="flex size-20 items-center justify-center rounded-full bg-primary-500/10">
				<ShieldCheck className="size-9 text-primary-500" aria-hidden="true" />
			</span>

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Secure your account
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					Turn on 2-factor authentication for extra security on every login.
					You can always set this up later from your Account page.
				</p>
			</div>

			<div className="flex w-full flex-col gap-3">
				<Button
					type="button"
					size="large"
					className="w-full"
					onClick={() => {
						setTwoFactorMethod("authenticator");
						router.push("/auth/sign-in/verify");
					}}
				>
					Continue
				</Button>
				<Button
					type="button"
					variant="outline"
					size="large"
					className="w-full"
					onClick={handleSkip}
				>
					Skip for now
				</Button>
			</div>
		</div>
	);
}

export { TwoFactorSetupPromptForm };
