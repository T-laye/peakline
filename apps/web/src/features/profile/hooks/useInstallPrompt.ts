"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

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
const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeStandalone(onChange: () => void) {
	const media = window.matchMedia(STANDALONE_QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

function isStandalone() {
	return (
		window.matchMedia(STANDALONE_QUERY).matches ||
		(window.navigator as { standalone?: boolean }).standalone === true
	);
}

function useInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
		null,
	);
	// Already running as an installed app — read from the browser rather
	// than copied into state inside an effect; `false` on the server.
	const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, () => false);
	const [installedNow, setInstalledNow] = useState(false);
	const installed = standalone || installedNow;

	useEffect(() => {
		function handleBeforeInstallPrompt(e: Event) {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		}
		function handleAppInstalled() {
			setInstalledNow(true);
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
