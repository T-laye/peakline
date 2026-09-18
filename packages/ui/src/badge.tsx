import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./lib/utils";

/**
 * Generic badge + the 5 payment states from the product brief, pre-wired to
 * the semantic status tokens so every screen renders them identically:
 * Pending -> warning, Processing -> info, Completed -> success,
 * Failed -> destructive, Cancelled -> neutral.
 */
const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-c2 whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary-100 text-primary-800",
				secondary: "border-transparent bg-secondary-100 text-secondary-900",
				outline: "border-border bg-transparent text-foreground",
				pending: "border-transparent bg-warning-100 text-warning-900",
				processing: "border-transparent bg-info-100 text-info-900",
				completed: "border-transparent bg-success-100 text-success-900",
				failed: "border-transparent bg-danger-100 text-danger-900",
				cancelled: "border-transparent bg-neutral-100 text-neutral-600",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface BadgeProps
	extends React.ComponentProps<"span">,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<span
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export type PaymentStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled"
	// A real ledger transaction status (reversed after settling), distinct
	// from "cancelled" (voided before ever completing) — visually the same
	// neutral treatment (there's no dedicated variant for it, and the two
	// read as close enough kin), just its own label.
	| "reversed";

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
	pending: "Pending",
	processing: "Processing",
	completed: "Completed",
	failed: "Failed",
	cancelled: "Cancelled",
	reversed: "Reversed",
};

function StatusBadge({
	status,
	className,
}: {
	status: PaymentStatus;
	className?: string;
}) {
	const variant = status === "reversed" ? "cancelled" : status;
	return (
		<Badge variant={variant} className={className}>
			<span
				className={cn("size-1.5 rounded-full", {
					"bg-warning-600": status === "pending",
					"bg-info-600": status === "processing",
					"bg-success-600": status === "completed",
					"bg-danger-600": status === "failed",
					"bg-neutral-400": status === "cancelled" || status === "reversed",
				})}
			/>
			{PAYMENT_STATUS_LABEL[status]}
		</Badge>
	);
}

export { Badge, badgeVariants, StatusBadge };
