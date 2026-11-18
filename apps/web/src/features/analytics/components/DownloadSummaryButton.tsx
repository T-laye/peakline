"use client";

import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/** `GET /merchant/reports/summary.csv` (`metric,amount,count`, last 30
 * days by default). Fetched with auth and saved as a blob — a plain link
 * wouldn't carry the bearer token. */
function DownloadSummaryButton({ className }: { className?: string }) {
	const axiosAuth = useAxiosAuth();
	const download = useMutation({
		mutationFn: async () => {
			const response = await axiosAuth.get<Blob>(apiRoutes.merchant.REPORT_SUMMARY_CSV, { responseType: "blob" });
			const url = URL.createObjectURL(response.data);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `peakline-summary-${new Date().toISOString().slice(0, 10)}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	});

	return (
		<Button
			type="button"
			variant="outline"
			size="large"
			className={className}
			loading={download.isPending}
			onClick={() =>
				download.mutate(undefined, {
					onSuccess: () => toast.success("Summary downloaded"),
					onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't download the summary")),
				})
			}
		>
			<Download className="size-4" aria-hidden="true" />
			Download summary
		</Button>
	);
}

export { DownloadSummaryButton };
