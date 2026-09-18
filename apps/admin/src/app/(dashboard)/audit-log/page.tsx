import type { Metadata } from "next";
import { AuditLogList } from "@/features/audit-log/components/AuditLogList";

export const metadata: Metadata = { title: "Audit Log — Peakline Admin" };

export default function AuditLogPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Audit Log</h1>
				<p className="text-b3 text-muted-foreground">Every staff action taken on the platform.</p>
			</div>
			<AuditLogList />
		</div>
	);
}
