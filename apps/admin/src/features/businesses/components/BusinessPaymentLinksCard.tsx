"use client";

import { Link2 } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { DetailCard } from "@/components/data/DetailCard";
import { useBusinessPaymentLinks } from "@/features/businesses/hooks";
import { formatUsdc } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import type { AdminBusinessPaymentLinkData } from "@/lib/api/types";

const STATUS_VARIANT: Record<AdminBusinessPaymentLinkData["status"], "completed" | "cancelled" | "failed"> = {
	active: "completed",
	expired: "cancelled",
	cancelled: "failed",
};

function BusinessPaymentLinksCard({ businessId }: { businessId: string }) {
	const { data: links, isLoading } = useBusinessPaymentLinks(businessId);

	return (
		<DetailCard title="Payment Links">
			{isLoading ? (
				<Skeleton className="h-24 w-full" />
			) : !links || links.length === 0 ? (
				<EmptyState icon={Link2} title="No payment links yet" />
			) : (
				<div className="flex flex-col gap-3">
					{links.map((link) => (
						<div key={link.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
							<div className="flex items-center justify-between gap-4">
								<span className="text-b3 font-medium text-foreground">{link.title}</span>
								<Badge variant={STATUS_VARIANT[link.status]}>{link.status}</Badge>
							</div>
							<span className="text-c1 text-muted-foreground">
								{formatUsdc(link.amount)} {link.currency} · created{" "}
								{formatDateTime(link.createdAt)}
							</span>
						</div>
					))}
				</div>
			)}
		</DetailCard>
	);
}

export { BusinessPaymentLinksCard };
