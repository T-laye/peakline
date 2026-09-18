"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import { HelperText } from "@repo/ui/helper-text";
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

interface SetRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: AdminUserData;
	isPending: boolean;
	onConfirm: (role: "staff" | "customer", staffRole: StaffRole | undefined, reason: string) => void;
}

/** Super_admin-only per the backend's own guard (see `UserActions`, which
 * only renders the trigger for that role). Promotes a customer to staff
 * (picking their `staffRole`) or demotes staff back to a plain customer. */
function SetRoleDialog({ open, onOpenChange, user, isPending, onConfirm }: SetRoleDialogProps) {
	const [role, setRole] = useState<"staff" | "customer">(user.role);
	const [staffRole, setStaffRole] = useState<StaffRole>(user.staffRole ?? "support");
	const [reason, setReason] = useState("");
	const [touched, setTouched] = useState(false);
	const reasonMissing = touched && reason.trim().length === 0;

	function handleOpenChange(next: boolean) {
		if (!next) {
			setRole(user.role);
			setStaffRole(user.staffRole ?? "support");
			setReason("");
			setTouched(false);
		}
		onOpenChange(next);
	}

	function handleConfirm() {
		if (reason.trim().length === 0) {
			setTouched(true);
			return;
		}
		onConfirm(role, role === "staff" ? staffRole : undefined, reason.trim());
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change account role</DialogTitle>
					<DialogDescription>
						{user.firstName} {user.lastName} is currently{" "}
						{user.role === "staff" ? `staff (${user.staffRole})` : "a customer"}.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="role">Role</Label>
					<Select
						id="role"
						value={role}
						onChange={(e) => setRole(e.target.value as "staff" | "customer")}
					>
						<option value="customer">Customer</option>
						<option value="staff">Staff</option>
					</Select>
				</div>

				{role === "staff" && (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="staffRole">Staff role</Label>
						<Select
							id="staffRole"
							value={staffRole}
							onChange={(e) => setStaffRole(e.target.value as StaffRole)}
						>
							{STAFF_ROLES.map((r) => (
								<option key={r} value={r}>
									{r.replace(/_/g, " ")}
								</option>
							))}
						</Select>
					</div>
				)}

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="role-reason">Reason</Label>
					<Textarea
						id="role-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						onBlur={() => setTouched(true)}
						placeholder="Why is this account's role changing?"
						aria-invalid={reasonMissing}
					/>
					{reasonMissing && <HelperText error>A reason is required</HelperText>}
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
						onClick={handleConfirm}
						className="w-full sm:w-auto"
					>
						Save role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { SetRoleDialog };
