/** Shared date/time formatting for every admin list/detail screen — a
 * plain, timezone-aware absolute timestamp (an ops console reading real
 * incident/audit timestamps wants the actual time, not a relative "2h ago"
 * that goes stale the moment the page sits open). `null` reads as "never"
 * (see `AdminUserData`'s own note on nullable timestamps meaning "never
 * happened"), not as a formatting failure. */
function formatDateTime(value: string | null | undefined, fallback = "—") {
	if (!value) return fallback;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return fallback;
	return date.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export { formatDateTime };
