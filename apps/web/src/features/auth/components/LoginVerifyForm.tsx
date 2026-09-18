"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVerifyLogin, useRouteAfterLogin } from "@/features/auth/hooks";
import { useLoginFlowStore } from "@/lib/stores/loginFlowStore";
import { useAccountSettingsStore } from "@/lib/stores/accountSettingsStore";
import { VerifyCodeForm } from "@/features/auth/components/VerifyCodeForm";

/**
 * Final step of 2FA (Figma node 127:2709 — the same "Verify" frame Sign Up
 * uses, hence the shared `VerifyCodeForm`) — only reached via the optional
 * setup prompt's "Continue" now that 2FA isn't a mandatory per-login gate;
 * a successful verify here is what actually turns 2FA on.
 */
function LoginVerifyForm() {
	const router = useRouter();
	const email = useLoginFlowStore((state) => state.email);
	const method = useLoginFlowStore((state) => state.twoFactorMethod);
	const setHas2FA = useAccountSettingsStore((state) => state.setHas2FA);
	const verifyLogin = useVerifyLogin();
	const routeAfterLogin = useRouteAfterLogin();

	// Reached without a chosen 2FA method in this session — send them back.
	useEffect(() => {
		if (!email || !method) {
			router.replace("/auth/sign-in");
		}
	}, [email, method, router]);

	if (!email || !method) return null;

	// Deliberately doesn't reset `loginFlowStore` here — see the identical
	// note in `TwoFactorSetupPromptForm`'s handleSkip: clearing it while
	// this component's own guard above is still mounted re-fires that guard
	// and races the navigation below.
	function handleGoToDashboard() {
		setHas2FA(true);
		routeAfterLogin();
	}

	return (
		<VerifyCodeForm
			method={method}
			destination={email}
			submitLabel="Verify"
			isPending={verifyLogin.isPending}
			onSubmit={(values) =>
				verifyLogin.mutate(
					{ ...values, email },
					{ onSuccess: handleGoToDashboard },
				)
			}
		/>
	);
}

export { LoginVerifyForm };
