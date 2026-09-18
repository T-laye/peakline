import { toast } from "@repo/ui/sonner";

/** Renders the `<svg>` a container ref points at onto a padded white canvas
 * and downloads it as a PNG — `react-qr-code` only ever renders a plain
 * SVG, no built-in export, and PNG is the more broadly useful format for
 * "print this and stick it at the counter" than a raw SVG file would be.
 * Shared by every "Download QR" action in the app (the merchant's own
 * store QR, a single payment link's QR) so they can't drift apart. */
function downloadSvgAsPng(svg: SVGSVGElement, filename: string) {
	const svgString = new XMLSerializer().serializeToString(svg);
	const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
	const svgUrl = URL.createObjectURL(svgBlob);

	const img = new Image();
	img.onload = () => {
		const padding = 32;
		const canvas = document.createElement("canvas");
		canvas.width = img.width + padding * 2;
		canvas.height = img.height + padding * 2;
		const ctx = canvas.getContext("2d");
		URL.revokeObjectURL(svgUrl);
		if (!ctx) {
			toast.error("Couldn't generate the QR image");
			return;
		}
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, padding, padding);
		canvas.toBlob((blob) => {
			if (!blob) {
				toast.error("Couldn't generate the QR image");
				return;
			}
			const pngUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = pngUrl;
			link.download = filename;
			link.click();
			URL.revokeObjectURL(pngUrl);
		}, "image/png");
	};
	img.onerror = () => {
		URL.revokeObjectURL(svgUrl);
		toast.error("Couldn't generate the QR image");
	};
	img.src = svgUrl;
}

export { downloadSvgAsPng };
