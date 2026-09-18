"use client";

import { Download, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useInstallPrompt } from "@/features/profile/hooks/useInstallPrompt";

/** Peakline is a PWA (see the manifest in the root layout) — this surfaces
 * the native install prompt where the browser supports one, and falls back
 * to plain instructions where it doesn't (Safari/iOS has no programmatic
 * prompt at all). */
function InstallAppCard() {
	const { canInstall, installed, promptInstall } = useInstallPrompt();

	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<div className="flex items-center gap-4">
				<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-500/10">
					<Smartphone className="size-5 text-primary-600" aria-hidden="true" />
				</span>
				<div className="flex flex-col">
					<span className="text-b3 font-semibold text-foreground sm:text-b2">
						Install Peakline
					</span>
					<span className="text-c1 text-muted-foreground sm:text-b3">
						{installed
							? "Already installed on this device."
							: canInstall
								? "Add Peakline to your home screen for quick, app-like access."
								: 'Use your browser\'s "Add to Home Screen" or "Install App" option to add Peakline to your device.'}
					</span>
				</div>
			</div>

			{installed ? (
				<CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
			) : (
				canInstall && (
					<Button type="button" size="small" className="shrink-0" onClick={promptInstall}>
						<Download className="size-4" aria-hidden="true" />
						Install
					</Button>
				)
			)}
		</div>
	);
}

export { InstallAppCard };
