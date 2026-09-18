import type { Metadata } from "next";
import { StaffList } from "@/features/staff/components/StaffList";

export const metadata: Metadata = { title: "Staff — Peakline Admin" };

export default function StaffPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Staff</h1>
				<p className="text-b3 text-muted-foreground">
					Everyone with admin console access.
				</p>
			</div>
			<StaffList />
		</div>
	);
}
