"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@repo/ui/dialog";

interface QrScannerDialogProps {
	onScan: (data: string) => void;
}

/**
 * Real device-camera QR scanning, for whenever a merchant can't send their
 * payment link electronically and shows it printed/on-screen instead —
 * `getUserMedia` for the camera stream, `jsQR` (a pure-JS, synchronous
 * decoder — no worker-file bundler wiring to fight, unlike most other
 * scanning libraries' default setup) sampling frames off an offscreen
 * canvas on a `requestAnimationFrame` loop. Replaces the old fake "Open
 * camera to scan" button that always resolved to the same hardcoded
 * merchant regardless of what was "scanned" — this decodes an actual QR
 * code and hands the raw decoded text (a payment link's URL or bare code)
 * to the same lookup the manual code-entry field uses.
 */
function QrScannerDialog({ onScan }: QrScannerDialogProps) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const frameRef = useRef<number | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		if (!open) return;

		let cancelled = false;

		function tick() {
			const video = videoRef.current;
			if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
				frameRef.current = requestAnimationFrame(tick);
				return;
			}
			if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
			const canvas = canvasRef.current;
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) {
				frameRef.current = requestAnimationFrame(tick);
				return;
			}
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const result = jsQR(imageData.data, imageData.width, imageData.height);
			if (result?.data) {
				setOpen(false);
				onScan(result.data);
				return;
			}
			frameRef.current = requestAnimationFrame(tick);
		}

		navigator.mediaDevices
			?.getUserMedia({ video: { facingMode: "environment" } })
			.then((stream) => {
				if (cancelled) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.play().catch(() => {});
				}
				frameRef.current = requestAnimationFrame(tick);
			})
			.catch(() => {
				if (!cancelled) {
					setError("Camera access was denied or isn't available on this device.");
				}
			});

		return () => {
			cancelled = true;
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		};
		// Intentionally re-run only when the dialog opens/closes — `onScan`
		// is stable for the lifetime of the page that renders this.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (next) setError(null);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="large" className="w-full">
					<Camera className="size-4" aria-hidden="true" />
					Scan QR Code
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Scan Merchant QR Code</DialogTitle>
					<DialogDescription>Align the QR code within the frame</DialogDescription>
				</DialogHeader>

				{error ? (
					<div className="flex flex-col items-center gap-3 rounded-xl bg-danger-50 p-6 text-center">
						<AlertCircle className="size-6 text-danger-600" aria-hidden="true" />
						<p className="text-b3 text-danger-700">{error}</p>
					</div>
				) : (
					<div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-900">
						<video ref={videoRef} muted playsInline className="size-full object-cover" />
						<span
							className="absolute top-6 left-6 size-10 rounded-tl-lg border-t-2 border-l-2 border-primary-400"
							aria-hidden="true"
						/>
						<span
							className="absolute top-6 right-6 size-10 rounded-tr-lg border-t-2 border-r-2 border-primary-400"
							aria-hidden="true"
						/>
						<span
							className="absolute bottom-6 left-6 size-10 rounded-bl-lg border-b-2 border-l-2 border-primary-400"
							aria-hidden="true"
						/>
						<span
							className="absolute right-6 bottom-6 size-10 rounded-br-lg border-r-2 border-b-2 border-primary-400"
							aria-hidden="true"
						/>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

export { QrScannerDialog };
