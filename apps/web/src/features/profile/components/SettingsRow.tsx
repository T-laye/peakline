import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface SettingsRowBaseProps {
	icon: LucideIcon;
	label: string;
	/** Red icon/label, matching every mock's own destructive-looking rows
	 * (Change PIN, Change Password, Logout, Delete Account) — plain
	 * black/gray for the rest (2FA, Terms, Privacy). */
	destructive?: boolean;
	/** Omit for a row whose entire right side is a custom control (2FA's
	 * own Switch/"Enable" button) instead of a chevron-navigates-somewhere
	 * affordance. */
	trailing?: React.ReactNode;
	className?: string;
}

type SettingsRowProps =
	| (SettingsRowBaseProps & { href: string } & Omit<
				React.ComponentProps<typeof Link>,
				"href" | "className"
			>)
	| (SettingsRowBaseProps & { href?: undefined } & Omit<
				React.ComponentProps<"button">,
				"type" | "className"
			>);

const rowClassName =
	"flex items-center justify-between gap-4 rounded-lg py-3 text-left transition-colors hover:bg-muted";

function RowContent({
	icon: Icon,
	label,
	destructive,
	trailing,
}: Pick<SettingsRowBaseProps, "icon" | "label" | "destructive" | "trailing">) {
	return (
		<>
			<span className="flex items-center gap-3">
				<Icon
					className={cn("size-5", destructive ? "text-destructive" : "text-foreground")}
					aria-hidden="true"
				/>
				<span
					className={cn(
						"text-b3 font-medium sm:text-b2",
						destructive ? "text-destructive" : "text-foreground",
					)}
				>
					{label}
				</span>
			</span>
			{trailing ?? <ChevronRight className="size-4.5 text-muted-foreground" aria-hidden="true" />}
		</>
	);
}

/**
 * One row in the Account Settings list — every item across both the
 * desktop tab and the mobile Profile page's own "Account Settings"
 * section shares this exact shape (icon + label + trailing chevron or
 * control), so it's one component rather than seven near-identical blocks.
 *
 * Picks its own root element rather than always being one or the other:
 * `href` renders a real `next/link` `Link` (Terms, Privacy — plain page
 * navigation); no `href` renders a `<button>`, usable directly as a
 * Dialog's `asChild` trigger (Change PIN, Change Password, Logout, Delete
 * Account all wrap this that way). Never both at once — a `<button>`
 * nested in a `Link`'s `<a>`, or vice versa, is invalid HTML and breaks
 * keyboard navigation (two stops for what should be one control).
 */
const SettingsRow = React.forwardRef<HTMLAnchorElement | HTMLButtonElement, SettingsRowProps>(
	({ icon, label, destructive, trailing, className, ...props }, ref) => {
		if (props.href !== undefined) {
			const { href, ...linkProps } = props as SettingsRowBaseProps & { href: string };
			return (
				<Link
					ref={ref as React.Ref<HTMLAnchorElement>}
					href={href}
					className={cn(rowClassName, className)}
					{...linkProps}
				>
					<RowContent icon={icon} label={label} destructive={destructive} trailing={trailing} />
				</Link>
			);
		}

		const buttonProps = props as SettingsRowBaseProps & { href?: undefined };
		return (
			<button
				ref={ref as React.Ref<HTMLButtonElement>}
				type="button"
				className={cn(rowClassName, className)}
				{...buttonProps}
			>
				<RowContent icon={icon} label={label} destructive={destructive} trailing={trailing} />
			</button>
		);
	},
);
SettingsRow.displayName = "SettingsRow";

export { SettingsRow };
