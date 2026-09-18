"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { useSignUpFlowStore } from "@/lib/stores/signUpFlowStore";
import { usePersonalInfoFlowStore } from "@/lib/stores/personalInfoFlowStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { FAKE_WALLET_ADDRESS, maskWalletAddress } from "@/lib/wallet";

/** End of Sign Up — wallet's created, PIN's set (Figma node 127:4186).
 * Clears the flow stores on arrival since nothing after this point needs
 * them. The address shown is the real one `useSetupWallet` just stored —
 * `FAKE_WALLET_ADDRESS` only stands in if this is somehow reached directly
 * without going through that step (shouldn't happen in the real flow). */
function SuccessForm() {
	const router = useRouter();
	const resetSignUpFlow = useSignUpFlowStore((state) => state.reset);
	const resetPersonalInfoFlow = usePersonalInfoFlowStore(
		(state) => state.reset,
	);
	const walletAddress = useAuthStore((state) => state.walletAddress) ?? FAKE_WALLET_ADDRESS;

	useEffect(() => {
		resetSignUpFlow();
		resetPersonalInfoFlow();
		// Runs once, on arrival — the setters are stable zustand references.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleCopyAddress() {
		try {
			await navigator.clipboard.writeText(walletAddress);
			toast.success("Wallet address copied");
		} catch {
			toast.error("Couldn't copy the address");
		}
	}

	return (
		<div className="flex flex-col items-center gap-8 text-center">
			<span className="flex size-32 items-center justify-center rounded-full bg-primary-500">
				<Check
					className="size-14 text-primary-foreground"
					strokeWidth={3}
					aria-hidden="true"
				/>
			</span>

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Your wallet is ready!
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					You&apos;re all set to start sending, receiving and paying with
					Peakline.
				</p>
			</div>

			<div className="flex w-full flex-col gap-1.5 rounded-2xl bg-background p-6 text-left shadow-md">
				<span className="text-c1 text-muted-foreground">
					Your wallet address
				</span>
				<div className="flex items-center justify-between gap-4">
					<span className="truncate text-b2 text-foreground">
						{maskWalletAddress(walletAddress)}
					</span>
					<button
						type="button"
						onClick={handleCopyAddress}
						aria-label="Copy wallet address"
						className="shrink-0 text-muted-foreground hover:text-foreground"
					>
						<Copy className="size-5" aria-hidden="true" />
					</button>
				</div>
			</div>

			<div className="flex w-full flex-col items-center gap-5">
				<Button
					type="button"
					size="large"
					className="w-full"
					onClick={() => router.push("/")}
				>
					Go to Dashboard
				</Button>
				<button
					type="button"
					onClick={() => router.push("/wallet")}
					className="text-b3 font-medium text-primary hover:underline"
				>
					Explore your wallet
				</button>
			</div>
		</div>
	);
}

export { SuccessForm };
