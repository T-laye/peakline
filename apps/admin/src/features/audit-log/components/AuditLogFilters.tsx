"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";

interface AuditLogFiltersProps {
	actorId: string;
	onActorIdChange: (value: string) => void;
	action: string;
	onActionChange: (value: string) => void;
	resourceType: string;
	onResourceTypeChange: (value: string) => void;
}

function AuditLogFilters({
	actorId,
	onActorIdChange,
	action,
	onActionChange,
	resourceType,
	onResourceTypeChange,
}: AuditLogFiltersProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
			<div className="relative flex-1 lg:min-w-48">
				<Search
					className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={actorId}
					onChange={(e) => onActorIdChange(e.target.value)}
					placeholder="Filter by actor (staff) ID"
					aria-label="Filter by actor ID"
					className="pl-10"
				/>
			</div>

			<Input
				value={action}
				onChange={(e) => onActionChange(e.target.value)}
				placeholder="e.g. user.lock"
				aria-label="Filter by action"
				className="lg:w-48"
			/>

			<Input
				value={resourceType}
				onChange={(e) => onResourceTypeChange(e.target.value)}
				placeholder="e.g. user, business"
				aria-label="Filter by resource type"
				className="lg:w-48"
			/>
		</div>
	);
}

export { AuditLogFilters };
