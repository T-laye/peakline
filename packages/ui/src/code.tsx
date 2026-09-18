import { cn } from "./lib/utils";

/**
 * Monospace inline chip — used for Stellar transaction hashes / reference
 * IDs (e.g. "...ABC123" in the transaction detail screen).
 */
function Code({ className, ...props }: React.ComponentProps<"code">) {
	return (
		<code
			data-slot="code"
			className={cn(
				"rounded-md bg-muted px-1.5 py-0.5 font-mono text-c1 text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export { Code };
