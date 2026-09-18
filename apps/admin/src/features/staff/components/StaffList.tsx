"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, UserCog, Ban, UserPlus } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { StaffFilters } from "@/features/staff/components/StaffFilters";
import { InviteStaffDialog } from "@/features/staff/components/InviteStaffDialog";
import { ChangeStaffRoleDialog } from "@/features/staff/components/ChangeStaffRoleDialog";
import { useAdminStaff, useChangeStaffRole, useDeactivateStaff } from "@/features/staff/hooks";
import { useAuthStore } from "@/lib/stores/authStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminUserData, StaffRole } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

type ActionState = { staff: AdminUserData; kind: "role" | "deactivate" } | null;

function StaffList() {
	const [staffRole, setStaffRole] = useState<StaffRole | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [inviteOpen, setInviteOpen] = useState(false);
	const [action, setAction] = useState<ActionState>(null);

	const isSuperAdmin = useAuthStore((state) => state.staffRole === "super_admin");
	const query = { staffRole: staffRole === "all" ? undefined : staffRole };
	const { data, isLoading, isError } = useAdminStaff(query, page, pageSize);
	const changeRole = useChangeStaffRole();
	const deactivate = useDeactivateStaff();

	function close() {
		setAction(null);
	}

	// `AdminUserDto`'s `deletedAt` isn't confirmed to be the same field
	// `DELETE /admin/staff/{id}` (deactivate) flips — the endpoint's own
	// summary just says "Deactivate a staff account" with no response body
	// documented at all (`data: null`). Reusing the one nullable timestamp
	// every other "this account can no longer act" state on this DTO uses
	// (locked/suspended/deleted all follow the same "null = never happened"
	// convention) is the closest confirmed signal available, but unverified
	// against a real deactivated staff record.
	const columns: Column<AdminUserData>[] = [
		{
			key: "name",
			label: "Name",
			render: (s) => `${s.firstName} ${s.lastName}`,
		},
		{ key: "email", label: "Email", render: (s) => s.email },
		{
			key: "staffRole",
			label: "Role",
			render: (s) => <Badge variant="outline">{(s.staffRole ?? "—").replace(/_/g, " ")}</Badge>,
		},
		{
			key: "status",
			label: "Status",
			render: (s) =>
				s.deletedAt ? (
					<Badge variant="failed">Deactivated</Badge>
				) : (
					<Badge variant="completed">Active</Badge>
				),
		},
		...(isSuperAdmin
			? [
					{
						key: "actions",
						label: "Actions",
						render: (s: AdminUserData) => (
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="small"
									iconOnly
									aria-label={`Change role for ${s.firstName} ${s.lastName}`}
									onClick={() => setAction({ staff: s, kind: "role" })}
								>
									<UserCog className="size-4" aria-hidden="true" />
								</Button>
								{!s.deletedAt && (
									<Button
										type="button"
										variant="outline"
										size="small"
										iconOnly
										className="border-destructive text-destructive hover:bg-danger-50"
										aria-label={`Deactivate ${s.firstName} ${s.lastName}`}
										onClick={() => setAction({ staff: s, kind: "deactivate" })}
									>
										<Ban className="size-4" aria-hidden="true" />
									</Button>
								)}
							</div>
						),
					} satisfies Column<AdminUserData>,
				]
			: []),
	];

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<StaffFilters staffRole={staffRole} onStaffRoleChange={handleFilterChange(setStaffRole)} />
				{isSuperAdmin && (
					<Button type="button" onClick={() => setInviteOpen(true)}>
						<UserPlus className="size-4" aria-hidden="true" />
						Invite staff
					</Button>
				)}
			</div>

			{isLoading || !data ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<DataTable
						columns={columns}
						rows={[]}
						rowKey={(s) => s.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load staff"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={columns}
						rows={data.staff}
						rowKey={(s) => s.id}
						emptyIcon={ShieldCheck}
						emptyTitle="No staff found"
						emptyDescription="Nothing matches your current filters."
					/>
					{data.meta.totalCount > 0 && (
						<Pagination
							page={data.meta.currentPage}
							totalPages={data.meta.pageCount}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={(size) => {
								setPageSize(size);
								setPage(1);
							}}
							pageSizeOptions={PAGE_SIZE_OPTIONS}
							itemsShown={data.staff.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}

			<InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} />

			<ChangeStaffRoleDialog
				staff={action?.kind === "role" ? action.staff : null}
				onOpenChange={(open) => !open && close()}
				isPending={changeRole.isPending}
				onConfirm={(newRole) => {
					if (!action) return;
					changeRole.mutate(
						{ id: action.staff.id, staffRole: newRole },
						{
							onSuccess: () => {
								toast.success("Staff role updated");
								close();
							},
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't update role")),
						},
					);
				}}
			/>

			<ConfirmActionDialog
				open={action?.kind === "deactivate"}
				onOpenChange={(open) => !open && close()}
				title="Deactivate this staff account"
				description={
					action
						? `${action.staff.firstName} ${action.staff.lastName} will no longer be able to sign in to the admin console.`
						: ""
				}
				confirmLabel="Deactivate account"
				destructive
				reason="hidden"
				isPending={deactivate.isPending}
				onConfirm={() => {
					if (!action) return;
					deactivate.mutate(action.staff.id, {
						onSuccess: () => {
							toast.success("Staff account deactivated");
							close();
						},
						onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't deactivate account")),
					});
				}}
			/>
		</div>
	);
}

export { StaffList };
