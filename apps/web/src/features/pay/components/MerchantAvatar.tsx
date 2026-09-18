import { cn } from "@repo/ui/lib/utils";

/** Single-letter avatar for a merchant — unlike `UserAvatar`'s two-initial
 * scheme (first+last name), the mock shows just one letter for a business
 * name, so this is its own small component rather than a UserAvatar prop. */
function MerchantAvatar({ name, className }: { name: string; className?: string }) {
	return (
		<span
			className={cn(
				"flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-h5 font-semibold text-primary-600 sm:size-20",
				className,
			)}
		>
			{name.charAt(0).toUpperCase()}
		</span>
	);
}

export { MerchantAvatar };
