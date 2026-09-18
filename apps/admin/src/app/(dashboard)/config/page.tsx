import type { Metadata } from "next";
import { ConfigList } from "@/features/config/components/ConfigList";

export const metadata: Metadata = { title: "Config — Peakline Admin" };

export default function ConfigPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Config</h1>
				<p className="text-b3 text-muted-foreground">
					System-wide settings, stored encrypted. Super admin only.
				</p>
			</div>
			<ConfigList />
		</div>
	);
}
