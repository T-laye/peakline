"use client";

import { SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import { useAdminBusiness } from "@/features/businesses/hooks";
import { BusinessActions } from "@/features/businesses/components/BusinessActions";
import { BusinessStatusHistoryCard } from "@/features/businesses/components/BusinessStatusHistoryCard";
import { BusinessWalletsCard } from "@/features/businesses/components/BusinessWalletsCard";
import { BusinessPaymentLinksCard } from "@/features/businesses/components/BusinessPaymentLinksCard";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminBusinessData } from "@/lib/api/types";

const STATUS_VARIANT: Record<AdminBusinessData["status"], "completed" | "pending" | "failed"> = {
	active: "completed",
	pending_verification: "pending",
	suspended: "failed",
};

const STATUS_LABEL: Record<AdminBusinessData["status"], string> = {
	active: "Active",
	pending_verification: "Pending Verification",
	suspended: "Suspended",
};

function BusinessDetail({ id }: { id: string }) {
	const { data: business, isLoading, isError, error } = useAdminBusiness(id);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Skeleton className="h-80 w-full rounded-2xl" />
				<Skeleton className="h-80 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !business) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="Business not found"
					description={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<BusinessActions business={business} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DetailCard title="Business">
					<FieldRow label="Name" value={business.name} />
					<FieldRow label="Category" value={business.category} />
					<FieldRow
						label="Status"
						value={
							<Badge variant={STATUS_VARIANT[business.status]}>
								{STATUS_LABEL[business.status]}
							</Badge>
						}
					/>
					<FieldRow label="Owner ID" value={business.ownerId} />
					<FieldRow label="Country" value={business.country} />
					{business.city && <FieldRow label="City" value={business.city} />}
					{business.address && <FieldRow label="Address" value={business.address} />}
					{business.phone && <FieldRow label="Phone" value={business.phone} />}
					{business.website && <FieldRow label="Website" value={business.website} />}
				</DetailCard>

				<DetailCard title="Verification & Records">
					<FieldRow label="Verified" value={formatDateTime(business.verifiedAt, "Not verified")} />
					{business.registrationNumber && (
						<FieldRow label="Registration number" value={business.registrationNumber} />
					)}
					{business.taxId && <FieldRow label="Tax ID" value={business.taxId} />}
					{business.description && <FieldRow label="Description" value={business.description} />}
					<FieldRow label="Created" value={formatDateTime(business.createdAt)} />
					<FieldRow label="Last updated" value={formatDateTime(business.updatedAt)} />
				</DetailCard>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<BusinessWalletsCard businessId={business.id} />
				<BusinessPaymentLinksCard businessId={business.id} />
			</div>

			<BusinessStatusHistoryCard businessId={business.id} />
		</div>
	);
}

export { BusinessDetail };
