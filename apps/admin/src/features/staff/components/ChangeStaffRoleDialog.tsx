"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Select } from "@repo/ui/select";
import { Label } from "@repo/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@repo/ui/dialog";
import type { AdminUserData, StaffRole } from "@/lib/api/types";

const STAFF_ROLES: StaffRole[] = ["admin", "super_admin", "support", "compliance", "operations"];

interface ChangeStaffRoleDialogProps {
	staff: AdminUserData | null;
	onOpenChange: (open: boolean) => void;
	isPending: boolean;
	onConfirm: (staffRole: StaffRole) => void;
}

/** No `reason` field — unlike `SetRoleDialog`'s promote/demote (a much
 * bigger change: customer to staff or the reverse), `AdminChangeStaffRoleDto`
 * only ever carries `staffRole` — confirmed live, no `reason` on this DTO
 * at all. `staff: null` closes the dialog (rather than a separate `open`
 * prop) since there's always a specific row this acts on. */
function ChangeStaffRoleDialog({
	staff,
	onOpenChange,
	isPending,
	onConfirm,
}: ChangeStaffRoleDialogProps) {
	const [staffRole, setStaffRole] = useState<StaffRole>(staff?.staffRole ?? "support");

	function handleOpenChange(next: boolean) {
		if (next && staff) setStaffRole(staff.staffRole ?? "support");
		onOpenChange(next);
	}

	return (
		<Dialog open={!!staff} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change staff role</DialogTitle>
					<DialogDescription>
						{staff && `${staff.firstName} ${staff.lastName} is currently ${staff.staffRole}.`}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="staff-role">Staff role</Label>
					<Select
						id="staff-role"
						value={staffRole}
						onChange={(e) => setStaffRole(e.target.value as StaffRole)}
					>
						{STAFF_ROLES.map((role) => (
							<option key={role} value={role}>
								{role.replace(/_/g, " ")}
							</option>
						))}
					</Select>
				</div>

				<DialogFooter className="sm:flex-row sm:justify-end">
					<DialogClose asChild>
						<Button type="button" variant="outline" className="w-full sm:w-auto">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						loading={isPending}
						onClick={() => onConfirm(staffRole)}
						className="w-full sm:w-auto"
					>
						Save role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ChangeStaffRoleDialog };
