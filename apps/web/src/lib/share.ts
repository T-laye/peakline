import { MessageCircle, Mail, Link as LinkIcon, MoreHorizontal } from "lucide-react";
import { toast } from "@repo/ui/sonner";

export interface ShareOption {
	label: string;
	icon: typeof MessageCircle;
	iconClassName?: string;
	onClick: (link: string) => void;
}

export async function copyLink(link: string) {
	try {
		await navigator.clipboard.writeText(link);
		toast.success("Link copied");
	} catch {
		toast.error("Couldn't copy");
	}
}

/**
 * WhatsApp/Email open their real share URLs, "Copy Link" uses the real
 * clipboard, and "More" uses the real Web Share API where available —
 * genuinely functional, not stubs, since all four are just browser-native
 * mechanisms with no backend involved. Used by `PaymentLinkCreatedCard`
 * (merchant's Payment Links).
 */
function getShareOptions(subject: string): ShareOption[] {
	return [
		{
			label: "Whatsapp",
			icon: MessageCircle,
			iconClassName: "text-success",
			onClick: (link) =>
				window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank", "noopener"),
		},
		{
			label: "Email",
			icon: Mail,
			onClick: (link) => {
				window.location.href = `mailto:?subject=${encodeURIComponent(
					subject,
				)}&body=${encodeURIComponent(link)}`;
			},
		},
		{
			label: "Copy Link",
			icon: LinkIcon,
			onClick: copyLink,
		},
		{
			label: "More",
			icon: MoreHorizontal,
			onClick: async (link) => {
				if (navigator.share) {
					try {
						await navigator.share({ url: link, title: subject });
					} catch {
						// User cancelled the share sheet — not an error.
					}
				} else {
					copyLink(link);
				}
			},
		},
	];
}

export { getShareOptions };
