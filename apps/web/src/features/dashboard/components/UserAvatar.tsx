import { cn } from "@repo/ui/lib/utils";

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""}`.toUpperCase();
}

/** Initials-based avatar — shared by the desktop Topbar, the mobile
 * greeting row, and the Account page's own header. Renders the account's
 * real uploaded photo (`ProfileData.avatarUrl`, real now — see
 * `useUpdateAvatar`) when there is one; falls back to initials otherwise,
 * same as before a photo ever existed. */
function UserAvatar({
	name,
	avatarUrl,
	className,
}: {
	name: string;
	avatarUrl?: string | null;
	className?: string;
}) {
	if (avatarUrl) {
		// A presigned, externally-hosted URL (S3/CDN) — `next/image`'s
		// optimizer would need that host allow-listed for no real benefit at
		// this size.
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={avatarUrl}
				alt={name || "Profile photo"}
				className={cn("size-9 shrink-0 rounded-full object-cover", className)}
			/>
		);
	}

	return (
		<span
			className={cn(
				"flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-c2 font-semibold text-primary-800",
				className,
			)}
		>
			{initials(name)}
		</span>
	);
}

export { UserAvatar };
