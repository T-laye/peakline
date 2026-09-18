"use client";

import { History } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { DetailCard } from "@/components/data/DetailCard";
import { useBusinessStatusHistory } from "@/features/businesses/hooks";
import { formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
	active: "Active",
	pending_verification: "Pending Verification",
	suspended: "Suspended",
};

function BusinessStatusHistoryCard({ businessId }: { businessId: string }) {
	const { data: events, isLoading } = useBusinessStatusHistory(businessId);

	return (
		<DetailCard title="Status History">
			{isLoading ? (
				<Skeleton className="h-24 w-full" />
			) : !events || events.length === 0 ? (
				<EmptyState icon={History} title="No status changes yet" />
			) : (
				<div className="flex flex-col gap-3">
					{events.map((event) => (
						<div key={event.id} className="flex flex-col gap-0.5 rounded-lg border border-border p-3">
							<span className="text-b3 font-medium text-foreground">
								{event.fromStatus ? STATUS_LABEL[event.fromStatus] ?? event.fromStatus : "—"}
								{" → "}
								{STATUS_LABEL[event.toStatus] ?? event.toStatus}
							</span>
							<span className="text-c1 text-muted-foreground">
								{formatDateTime(event.createdAt)} · by {event.changedBy}
							</span>
							{event.reason && <span className="text-c1 text-muted-foreground">{event.reason}</span>}
						</div>
					))}
				</div>
			)}
		</DetailCard>
	);
}

export { BusinessStatusHistoryCard };
