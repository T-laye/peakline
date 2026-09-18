"use client";

import { SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Badge } from "@repo/ui/badge";
import { DetailCard, FieldRow } from "@/components/data/DetailCard";
import { useAdminUser } from "@/features/users/hooks";
import { isCurrentlyLocked } from "@/features/users/utils";
import { UserActions } from "@/features/users/components/UserActions";
import { UserSessionsCard } from "@/features/users/components/UserSessionsCard";
import { UserTwoFaCard } from "@/features/users/components/UserTwoFaCard";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

function UserDetail({ id }: { id: string }) {
	const { data: user, isLoading, isError, error } = useAdminUser(id);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Skeleton className="h-80 w-full rounded-2xl" />
				<Skeleton className="h-80 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !user) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={SearchX}
					title="User not found"
					description={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
				/>
			</div>
		);
	}

	const locked = isCurrentlyLocked(user);

	return (
		<div className="flex flex-col gap-4">
			<UserActions user={user} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DetailCard title="Profile">
					<FieldRow label="Name" value={`${user.firstName} ${user.lastName}`} />
					{user.otherName && <FieldRow label="Other name" value={user.otherName} />}
					<FieldRow label="Email" value={user.email} />
					<FieldRow label="Phone" value={`${user.countryCode} ${user.phoneNumber}`} />
					{user.username && <FieldRow label="Username" value={user.username} />}
					<FieldRow
						label="Account type"
						value={
							user.role === "staff" ? (user.staffRole ?? "Staff") : (user.customerType ?? "—")
						}
					/>
					<FieldRow label="KYC tier" value={`Tier ${user.kycTier}`} />
					<FieldRow label="Joined" value={formatDateTime(user.createdAt)} />
					<FieldRow label="Last updated" value={formatDateTime(user.updatedAt)} />
				</DetailCard>

				<DetailCard title="Status & Security">
					<FieldRow
						label="Account status"
						value={
							locked ? <Badge variant="failed">Locked</Badge> : <Badge variant="completed">Active</Badge>
						}
					/>
					{locked && (
						<FieldRow
							label="Locked until"
							value={user.lockedUntil ? formatDateTime(user.lockedUntil) : "Indefinite"}
						/>
					)}
					<FieldRow label="Login attempts" value={user.loginAttempts ?? 0} />
					<FieldRow label="PIN attempts" value={user.pinAttempts ?? 0} />
					{user.pinLockedUntil && (
						<FieldRow label="PIN locked until" value={formatDateTime(user.pinLockedUntil)} />
					)}
					<FieldRow label="Email verified" value={formatDateTime(user.emailVerifiedAt, "Not verified")} />
					<FieldRow label="Phone verified" value={formatDateTime(user.phoneVerifiedAt, "Not verified")} />
					<FieldRow label="KYC verified" value={formatDateTime(user.kycVerifiedAt, "Not verified")} />
					<FieldRow label="Last login" value={formatDateTime(user.lastLoginAt)} />
					{user.lastLoginIp && <FieldRow label="Last login IP" value={user.lastLoginIp} />}
					{user.suspendedAt && (
						<>
							<FieldRow label="Suspended" value={formatDateTime(user.suspendedAt)} />
							<FieldRow label="Suspension reason" value={user.suspendedReason ?? "—"} />
						</>
					)}
					{user.deletionRequestedAt && (
						<FieldRow label="Deletion requested" value={formatDateTime(user.deletionRequestedAt)} />
					)}
					{user.deletedAt && <FieldRow label="Deleted" value={formatDateTime(user.deletedAt)} />}
				</DetailCard>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<UserSessionsCard userId={user.id} />
				<UserTwoFaCard userId={user.id} />
			</div>
		</div>
	);
}

export { UserDetail };
