"use client";

import { useCallback, useEffect, useState } from "react";

/** Chrome/Edge/Android's install-prompt event — not yet in lib.dom.d.ts,
 * so declared by hand. */
interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Wraps the PWA install flow: Chromium-based browsers fire
 * `beforeinstallprompt` when the manifest/icons/HTTPS criteria are met,
 * handing over an event whose `.prompt()` shows the native install UI.
 * Safari/iOS never fire it at all (no programmatic install prompt exists
 * there — "Add to Home Screen" is a manual Share-sheet action), so
 * `canInstall` staying false there is expected, not a bug; the account
 * page's own copy explains the manual path for that case.
 */
function useInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
		null,
	);
	const [installed, setInstalled] = useState(false);

	useEffect(() => {
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as { standalone?: boolean }).standalone === true;
		setInstalled(isStandalone);

		function handleBeforeInstallPrompt(e: Event) {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		}
		function handleAppInstalled() {
			setInstalled(true);
			setDeferredPrompt(null);
		}

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	const promptInstall = useCallback(async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		await deferredPrompt.userChoice;
		// Chrome only allows a captured prompt event to be used once.
		setDeferredPrompt(null);
	}, [deferredPrompt]);

	return { canInstall: !!deferredPrompt, installed, promptInstall };
}

export { useInstallPrompt };
